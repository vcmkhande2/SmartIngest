import { Router, type IRouter } from "express";
import { desc, sql, eq } from "drizzle-orm";
import {
  db,
  creditUnionsTable,
  ingestionJobsTable,
  processedRecordsTable,
  fieldMappingsTable,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [creditUnionCounts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${creditUnionsTable.status} = 'active')::int`,
    })
    .from(creditUnionsTable);

  const [jobCounts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      thisMonth: sql<number>`count(*) filter (where ${ingestionJobsTable.createdAt} >= date_trunc('month', now()))::int`,
      pendingReview: sql<number>`count(*) filter (where ${ingestionJobsTable.status} in ('uploaded', 'mapping', 'mapped', 'reviewing'))::int`,
    })
    .from(ingestionJobsTable);

  const [recordCounts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      accepted: sql<number>`count(*) filter (where ${processedRecordsTable.status} = 'accepted')::int`,
      hardErrors: sql<number>`count(*) filter (where ${processedRecordsTable.status} = 'hard_error')::int`,
      softErrors: sql<number>`count(*) filter (where ${processedRecordsTable.status} = 'soft_error')::int`,
    })
    .from(processedRecordsTable);

  const [avgConfidence] = await db
    .select({
      avg: sql<number>`coalesce(avg(${fieldMappingsTable.confidenceScore}), 0)`,
    })
    .from(fieldMappingsTable);

  res.json({
    totalCreditUnions: creditUnionCounts?.total ?? 0,
    activeCreditUnions: creditUnionCounts?.active ?? 0,
    totalJobsAllTime: jobCounts?.total ?? 0,
    jobsThisMonth: jobCounts?.thisMonth ?? 0,
    avgMappingConfidence: Math.round((avgConfidence?.avg ?? 0) * 100) / 100,
    totalRecordsProcessed: recordCounts?.total ?? 0,
    totalRecordsAccepted: recordCounts?.accepted ?? 0,
    totalHardErrors: recordCounts?.hardErrors ?? 0,
    totalSoftErrors: recordCounts?.softErrors ?? 0,
    pendingReview: jobCounts?.pendingReview ?? 0,
  });
});

router.get("/dashboard/recent-jobs", async (_req, res): Promise<void> => {
  const jobs = await db
    .select({
      job: ingestionJobsTable,
      creditUnionName: creditUnionsTable.name,
    })
    .from(ingestionJobsTable)
    .leftJoin(creditUnionsTable, eq(ingestionJobsTable.creditUnionId, creditUnionsTable.id))
    .orderBy(desc(ingestionJobsTable.createdAt))
    .limit(10);

  res.json(
    jobs.map(({ job, creditUnionName }) => ({
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
    }))
  );
});

router.get("/dashboard/credit-union-stats", async (_req, res): Promise<void> => {
  const unions = await db.select().from(creditUnionsTable);

  const stats = await Promise.all(
    unions.map(async (cu) => {
      const [jobStats] = await db
        .select({
          totalJobs: sql<number>`count(*)::int`,
          lastJobAt: sql<string | null>`max(${ingestionJobsTable.createdAt})`,
        })
        .from(ingestionJobsTable)
        .where(eq(ingestionJobsTable.creditUnionId, cu.id));

      const [recordStats] = await db
        .select({
          total: sql<number>`count(*)::int`,
          accepted: sql<number>`count(*) filter (where ${processedRecordsTable.status} = 'accepted')::int`,
          hardErrors: sql<number>`count(*) filter (where ${processedRecordsTable.status} = 'hard_error')::int`,
          softErrors: sql<number>`count(*) filter (where ${processedRecordsTable.status} = 'soft_error')::int`,
        })
        .from(processedRecordsTable)
        .innerJoin(ingestionJobsTable, eq(processedRecordsTable.ingestionJobId, ingestionJobsTable.id))
        .where(eq(ingestionJobsTable.creditUnionId, cu.id));

      const [avgConf] = await db
        .select({ avg: sql<number>`coalesce(avg(${fieldMappingsTable.confidenceScore}), 0)` })
        .from(fieldMappingsTable)
        .innerJoin(ingestionJobsTable, eq(fieldMappingsTable.ingestionJobId, ingestionJobsTable.id))
        .where(eq(ingestionJobsTable.creditUnionId, cu.id));

      return {
        creditUnionId: cu.id,
        creditUnionName: cu.name,
        totalJobs: jobStats?.totalJobs ?? 0,
        totalRecords: recordStats?.total ?? 0,
        acceptedRecords: recordStats?.accepted ?? 0,
        hardErrors: recordStats?.hardErrors ?? 0,
        softErrors: recordStats?.softErrors ?? 0,
        lastJobAt: jobStats?.lastJobAt ?? null,
        avgConfidence: Math.round((avgConf?.avg ?? 0) * 100) / 100,
      };
    })
  );

  res.json(stats);
});

export default router;
