import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import {
  db,
  ingestionJobsTable,
  creditUnionsTable,
  fieldMappingsTable,
  processedRecordsTable,
  dataQualityRulesTable,
  canonicalFieldsTable,
  emailReportsTable,
} from "@workspace/db";
import {
  CreateIngestionJobBody,
  GetIngestionJobParams,
  ProcessIngestionJobParams,
  ApproveMappingsParams,
  ApproveMappingsBody,
  ListIngestionJobsQueryParams,
} from "@workspace/api-zod";
import { parseFileContent } from "../lib/fileParser";
import { aiMapFields, aiGenerateEmailReport } from "../lib/aiMappingService";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function formatJob(job: typeof ingestionJobsTable.$inferSelect, creditUnionName?: string | null) {
  return {
    id: job.id,
    creditUnionId: job.creditUnionId,
    creditUnionName: creditUnionName ?? null,
    fileName: job.fileName,
    fileType: job.fileType,
    fileSize: job.fileSize ?? null,
    status: job.status,
    totalRecords: job.totalRecords ?? null,
    processedRecords: job.processedRecords ?? null,
    acceptedRecords: job.acceptedRecords ?? null,
    softErrorRecords: job.softErrorRecords ?? null,
    hardErrorRecords: job.hardErrorRecords ?? null,
    mappingConfidenceAvg: job.mappingConfidenceAvg ?? null,
    errorSummary: job.errorSummary ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

async function runAutoPipeline(jobId: number) {
  try {
    const [jobResult] = await db
      .select({ job: ingestionJobsTable, creditUnionName: creditUnionsTable.name, creditUnionEmail: creditUnionsTable.contactEmail })
      .from(ingestionJobsTable)
      .leftJoin(creditUnionsTable, eq(ingestionJobsTable.creditUnionId, creditUnionsTable.id))
      .where(eq(ingestionJobsTable.id, jobId));

    if (!jobResult) {
      logger.error({ jobId }, "runAutoPipeline: job not found");
      return;
    }

    const job = jobResult.job;

    // Stage 1: AI Mapping
    await db.update(ingestionJobsTable).set({ status: "mapping" }).where(eq(ingestionJobsTable.id, jobId));

    const canonicalFields = await db.select().from(canonicalFieldsTable);
    const parsed = parseFileContent(job.fileContent ?? "", job.fileType, job.fileName);

    const mappingResults = await aiMapFields(parsed.headers, parsed.rows, canonicalFields);

    const avgConfidence =
      mappingResults.length > 0
        ? mappingResults.reduce((sum, m) => sum + m.confidenceScore, 0) / mappingResults.length
        : 0;

    await db.delete(fieldMappingsTable).where(eq(fieldMappingsTable.ingestionJobId, jobId));

    for (const m of mappingResults) {
      const sampleValues = parsed.rows
        .slice(0, 5)
        .map((r) => r[m.sourceField] ?? "")
        .filter(Boolean);

      await db.insert(fieldMappingsTable).values({
        ingestionJobId: jobId,
        sourceField: m.sourceField,
        canonicalField: m.canonicalField ?? null,
        canonicalFieldLabel: m.canonicalFieldLabel ?? null,
        confidenceScore: m.confidenceScore,
        aiReasoning: m.aiReasoning,
        isApproved: true,
        isOverridden: false,
        sampleValues: JSON.stringify(sampleValues),
      });
    }

    await db
      .update(ingestionJobsTable)
      .set({ status: "mapped", mappingConfidenceAvg: avgConfidence })
      .where(eq(ingestionJobsTable.id, jobId));

    // Stage 2: DQ Processing
    await db.update(ingestionJobsTable).set({ status: "processing" }).where(eq(ingestionJobsTable.id, jobId));

    const approvedMappings = await db
      .select()
      .from(fieldMappingsTable)
      .where(and(eq(fieldMappingsTable.ingestionJobId, jobId), eq(fieldMappingsTable.isApproved, true)));

    const qualityRules = await db
      .select()
      .from(dataQualityRulesTable)
      .where(eq(dataQualityRulesTable.isActive, true));

    await db.delete(processedRecordsTable).where(eq(processedRecordsTable.ingestionJobId, jobId));

    let accepted = 0;
    let softErrors = 0;
    let hardErrors = 0;
    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      const canonicalData: Record<string, string> = {};
      for (const m of approvedMappings) {
        if (m.canonicalField) {
          canonicalData[m.canonicalField] = row[m.sourceField] ?? "";
        }
      }

      const errors: Array<{ field: string; rule: string; severity: string; message: string }> = [];
      for (const rule of qualityRules) {
        const value = canonicalData[rule.field];
        let failed = false;
        let message = "";

        try {
          const config = JSON.parse(rule.ruleConfig);
          if (rule.ruleType === "required") {
            if (!value || value.trim() === "") {
              failed = true;
              message = `Field "${rule.field}" is required but missing or empty`;
            }
          } else if (rule.ruleType === "format" && config.regex) {
            if (value && !new RegExp(config.regex).test(value)) {
              failed = true;
              message = `Field "${rule.field}" has invalid format: ${value}`;
            }
          } else if (rule.ruleType === "range") {
            const num = parseFloat(value ?? "");
            if (isNaN(num)) {
              failed = true;
              message = `Field "${rule.field}" must be a number`;
            } else if (config.min != null && num < config.min) {
              failed = true;
              message = `Field "${rule.field}" value ${num} is below minimum ${config.min}`;
            } else if (config.max != null && num > config.max) {
              failed = true;
              message = `Field "${rule.field}" value ${num} exceeds maximum ${config.max}`;
            }
          }
        } catch {
          logger.warn({ ruleId: rule.id }, "Failed to evaluate quality rule");
        }

        if (failed) {
          errors.push({ field: rule.field, rule: rule.name, severity: rule.severity, message });
        }
      }

      const hasHardError = errors.some((e) => e.severity === "hard");
      const hasSoftError = errors.some((e) => e.severity === "soft");

      let status: "accepted" | "soft_error" | "hard_error" = "accepted";
      let errorSeverity: string | null = null;

      if (hasHardError) {
        status = "hard_error";
        errorSeverity = "hard";
        hardErrors++;
      } else if (hasSoftError) {
        status = "soft_error";
        errorSeverity = "soft";
        softErrors++;
      } else {
        accepted++;
      }

      await db.insert(processedRecordsTable).values({
        ingestionJobId: jobId,
        rowNumber: i + 1,
        status,
        canonicalData: JSON.stringify(canonicalData),
        rawData: JSON.stringify(row),
        errorDetails: errors.length > 0 ? JSON.stringify(errors) : null,
        errorSeverity,
      });
    }

    await db
      .update(creditUnionsTable)
      .set({
        totalJobsRun:
          (
            await db
              .select({ count: creditUnionsTable.totalJobsRun })
              .from(creditUnionsTable)
              .where(eq(creditUnionsTable.id, job.creditUnionId))
              .then((r) => r[0]?.count ?? 0)
          ) + 1,
        lastIngestionAt: new Date(),
      })
      .where(eq(creditUnionsTable.id, job.creditUnionId));

    const finalStatus =
      hardErrors === parsed.rows.length ? "failed" : hardErrors > 0 ? "partial" : "completed";

    await db
      .update(ingestionJobsTable)
      .set({
        status: finalStatus,
        processedRecords: parsed.rows.length,
        acceptedRecords: accepted,
        softErrorRecords: softErrors,
        hardErrorRecords: hardErrors,
      })
      .where(eq(ingestionJobsTable.id, jobId));

    // Stage 3: Auto-generate email report if there are any errors
    if (hardErrors > 0 || softErrors > 0) {
      try {
        const allRecords = await db
          .select()
          .from(processedRecordsTable)
          .where(eq(processedRecordsTable.ingestionJobId, jobId));

        const hardErrorList = allRecords
          .filter((r) => r.status === "hard_error")
          .map((r) => ({
            rowNumber: r.rowNumber,
            errorDetails: r.errorDetails
              ? JSON.stringify(JSON.parse(r.errorDetails).map((e: { message: string }) => e.message))
              : "Data quality violation",
          }));

        const softErrorList = allRecords
          .filter((r) => r.status === "soft_error")
          .map((r) => ({
            rowNumber: r.rowNumber,
            errorDetails: r.errorDetails
              ? JSON.stringify(JSON.parse(r.errorDetails).map((e: { message: string }) => e.message))
              : "Data quality warning",
          }));

        const creditUnionName = jobResult.creditUnionName ?? "Credit Union";
        const recipientEmail = jobResult.creditUnionEmail ?? "contact@creditunion.org";

        const reportData = await aiGenerateEmailReport({
          creditUnionName,
          recipientEmail,
          fileName: job.fileName,
          totalRecords: parsed.rows.length,
          hardErrors: hardErrorList,
          softErrors: softErrorList,
        });

        await db.insert(emailReportsTable).values({
          ingestionJobId: jobId,
          recipientEmail,
          subject: reportData.subject,
          bodyHtml: reportData.bodyHtml,
          hardErrorCount: hardErrors,
          softErrorCount: softErrors,
          status: "draft",
        });
      } catch (emailErr) {
        logger.warn({ jobId, err: emailErr }, "Failed to auto-generate email report");
      }
    }

    logger.info({ jobId, finalStatus, accepted, softErrors, hardErrors }, "Auto-pipeline complete");
  } catch (err) {
    logger.error({ jobId, err }, "runAutoPipeline failed");
    await db
      .update(ingestionJobsTable)
      .set({ status: "failed", errorSummary: err instanceof Error ? err.message : String(err) })
      .where(eq(ingestionJobsTable.id, jobId))
      .catch(() => {});
  }
}

router.get("/ingestion-jobs", async (req, res): Promise<void> => {
  const queryParams = ListIngestionJobsQueryParams.safeParse(req.query);

  const jobs = await db
    .select({
      job: ingestionJobsTable,
      creditUnionName: creditUnionsTable.name,
    })
    .from(ingestionJobsTable)
    .leftJoin(creditUnionsTable, eq(ingestionJobsTable.creditUnionId, creditUnionsTable.id))
    .orderBy(desc(ingestionJobsTable.createdAt));

  const filtered = queryParams.success
    ? jobs.filter((j) => {
        if (queryParams.data.creditUnionId != null && j.job.creditUnionId !== queryParams.data.creditUnionId)
          return false;
        if (queryParams.data.status != null && j.job.status !== queryParams.data.status) return false;
        return true;
      })
    : jobs;

  res.json(filtered.map(({ job, creditUnionName }) => formatJob(job, creditUnionName)));
});

router.post("/ingestion-jobs", async (req, res): Promise<void> => {
  const parsed = CreateIngestionJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { creditUnionId, fileName, fileType, fileSize, fileContent } = parsed.data;

  const parsed2 = parseFileContent(fileContent, fileType, fileName);
  const totalRecords = parsed2.totalRecords;

  const [job] = await db
    .insert(ingestionJobsTable)
    .values({
      creditUnionId,
      fileName,
      fileType,
      fileSize: fileSize ?? null,
      fileContent: fileContent,
      status: "uploaded",
      totalRecords,
    })
    .returning();

  const [cu] = await db
    .select({ name: creditUnionsTable.name })
    .from(creditUnionsTable)
    .where(eq(creditUnionsTable.id, creditUnionId));

  // Fire-and-forget the full auto-pipeline
  runAutoPipeline(job.id).catch((err) => logger.error({ jobId: job.id, err }, "Auto-pipeline unhandled error"));

  res.status(201).json(formatJob(job, cu?.name ?? null));
});

router.get("/ingestion-jobs/:id", async (req, res): Promise<void> => {
  const params = GetIngestionJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [result] = await db
    .select({
      job: ingestionJobsTable,
      creditUnionName: creditUnionsTable.name,
    })
    .from(ingestionJobsTable)
    .leftJoin(creditUnionsTable, eq(ingestionJobsTable.creditUnionId, creditUnionsTable.id))
    .where(eq(ingestionJobsTable.id, params.data.id));

  if (!result) {
    res.status(404).json({ error: "Ingestion job not found" });
    return;
  }

  res.json(formatJob(result.job, result.creditUnionName));
});

router.post("/ingestion-jobs/:id/process", async (req, res): Promise<void> => {
  const params = ProcessIngestionJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [jobResult] = await db
    .select({
      job: ingestionJobsTable,
      creditUnionName: creditUnionsTable.name,
    })
    .from(ingestionJobsTable)
    .leftJoin(creditUnionsTable, eq(ingestionJobsTable.creditUnionId, creditUnionsTable.id))
    .where(eq(ingestionJobsTable.id, params.data.id));

  if (!jobResult) {
    res.status(404).json({ error: "Ingestion job not found" });
    return;
  }

  runAutoPipeline(params.data.id).catch((err) => logger.error({ jobId: params.data.id, err }, "Manual pipeline error"));

  res.json(formatJob(jobResult.job, jobResult.creditUnionName));
});

router.post("/ingestion-jobs/:id/approve-mappings", async (req, res): Promise<void> => {
  const params = ApproveMappingsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const bodyParsed = ApproveMappingsBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const [jobResult] = await db
    .select({
      job: ingestionJobsTable,
      creditUnionName: creditUnionsTable.name,
    })
    .from(ingestionJobsTable)
    .leftJoin(creditUnionsTable, eq(ingestionJobsTable.creditUnionId, creditUnionsTable.id))
    .where(eq(ingestionJobsTable.id, params.data.id));

  if (!jobResult) {
    res.status(404).json({ error: "Ingestion job not found" });
    return;
  }

  const mappings = await db
    .select()
    .from(fieldMappingsTable)
    .where(eq(fieldMappingsTable.ingestionJobId, params.data.id));

  for (const mapping of mappings) {
    if (bodyParsed.data.mappingIds.length === 0 || bodyParsed.data.mappingIds.includes(mapping.id)) {
      await db
        .update(fieldMappingsTable)
        .set({ isApproved: true })
        .where(eq(fieldMappingsTable.id, mapping.id));
    }
  }

  res.json(formatJob(jobResult.job, jobResult.creditUnionName));
});

export default router;
