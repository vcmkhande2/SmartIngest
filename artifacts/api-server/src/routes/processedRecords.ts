import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, processedRecordsTable } from "@workspace/db";
import { ListIngestionRecordsParams, ListIngestionRecordsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/ingestion-jobs/:id/records", async (req, res): Promise<void> => {
  const params = ListIngestionRecordsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const queryParams = ListIngestionRecordsQueryParams.safeParse(req.query);

  let records = await db
    .select()
    .from(processedRecordsTable)
    .where(eq(processedRecordsTable.ingestionJobId, params.data.id))
    .orderBy(processedRecordsTable.rowNumber);

  if (queryParams.success && queryParams.data.status != null) {
    records = records.filter((r) => r.status === queryParams.data.status);
  }

  res.json(
    records.map((r) => ({
      id: r.id,
      ingestionJobId: r.ingestionJobId,
      rowNumber: r.rowNumber,
      status: r.status,
      canonicalData: r.canonicalData ?? null,
      rawData: r.rawData ?? null,
      errorDetails: r.errorDetails ?? null,
      errorSeverity: r.errorSeverity ?? null,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

export default router;
