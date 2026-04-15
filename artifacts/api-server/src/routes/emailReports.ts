import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  emailReportsTable,
  ingestionJobsTable,
  creditUnionsTable,
  processedRecordsTable,
} from "@workspace/db";
import {
  GetEmailReportParams,
  SendEmailReportParams,
  SendEmailReportBody,
} from "@workspace/api-zod";
import { aiGenerateEmailReport } from "../lib/aiMappingService";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function formatReport(r: typeof emailReportsTable.$inferSelect, creditUnionName?: string | null) {
  return {
    id: r.id,
    ingestionJobId: r.ingestionJobId,
    creditUnionName: creditUnionName ?? null,
    recipientEmail: r.recipientEmail,
    subject: r.subject,
    bodyHtml: r.bodyHtml,
    hardErrorCount: r.hardErrorCount,
    softErrorCount: r.softErrorCount,
    status: r.status,
    sentAt: r.sentAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/ingestion-jobs/:id/email-report", async (req, res): Promise<void> => {
  const params = GetEmailReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(emailReportsTable)
    .where(eq(emailReportsTable.ingestionJobId, params.data.id));

  if (existing) {
    res.json(formatReport(existing));
    return;
  }

  const [jobResult] = await db
    .select({ job: ingestionJobsTable, creditUnionName: creditUnionsTable.name, creditUnionEmail: creditUnionsTable.contactEmail })
    .from(ingestionJobsTable)
    .leftJoin(creditUnionsTable, eq(ingestionJobsTable.creditUnionId, creditUnionsTable.id))
    .where(eq(ingestionJobsTable.id, params.data.id));

  if (!jobResult) {
    res.status(404).json({ error: "Ingestion job not found" });
    return;
  }

  const hardErrorRecords = await db
    .select()
    .from(processedRecordsTable)
    .where(eq(processedRecordsTable.ingestionJobId, params.data.id));

  const hardErrors = hardErrorRecords
    .filter((r) => r.status === "hard_error")
    .map((r) => ({
      rowNumber: r.rowNumber,
      errorDetails: r.errorDetails ? JSON.stringify(JSON.parse(r.errorDetails).map((e: { message: string }) => e.message)) : "Data quality violation",
    }));

  const softErrors = hardErrorRecords.filter((r) => r.status === "soft_error");

  const creditUnionName = jobResult.creditUnionName ?? "Credit Union";
  const recipientEmail = jobResult.creditUnionEmail ?? "contact@creditunion.org";
  const totalRecords = jobResult.job.totalRecords ?? hardErrorRecords.length;

  let emailData: { subject: string; bodyHtml: string };
  try {
    emailData = await aiGenerateEmailReport({
      creditUnionName,
      recipientEmail,
      fileName: jobResult.job.fileName,
      totalRecords,
      hardErrors,
      softErrors: softErrors.map((r) => ({ rowNumber: r.rowNumber, errorDetails: r.errorDetails ?? "" })),
    });
  } catch (err) {
    logger.error({ err }, "Failed to generate AI email report");
    emailData = {
      subject: `Data Processing Report — ${creditUnionName}`,
      bodyHtml: `<p>Please contact TruStage for your data processing results.</p>`,
    };
  }

  const [report] = await db
    .insert(emailReportsTable)
    .values({
      ingestionJobId: params.data.id,
      recipientEmail,
      subject: emailData.subject,
      bodyHtml: emailData.bodyHtml,
      hardErrorCount: hardErrors.length,
      softErrorCount: softErrors.length,
      status: "draft",
    })
    .returning();

  res.json(formatReport(report, creditUnionName));
});

router.post("/ingestion-jobs/:id/email-report", async (req, res): Promise<void> => {
  const params = SendEmailReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SendEmailReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(emailReportsTable)
    .where(eq(emailReportsTable.ingestionJobId, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Email report not found — generate it first" });
    return;
  }

  const [updated] = await db
    .update(emailReportsTable)
    .set({
      status: "sent",
      sentAt: new Date(),
      recipientEmail: parsed.data.recipientEmail,
      subject: parsed.data.subject ?? existing.subject,
    })
    .where(eq(emailReportsTable.id, existing.id))
    .returning();

  res.json(formatReport(updated));
});

export default router;
