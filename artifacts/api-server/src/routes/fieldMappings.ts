import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, fieldMappingsTable } from "@workspace/db";
import {
  ListFieldMappingsParams,
  UpdateFieldMappingsParams,
  UpdateFieldMappingsBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatMapping(m: typeof fieldMappingsTable.$inferSelect) {
  return {
    id: m.id,
    ingestionJobId: m.ingestionJobId,
    sourceField: m.sourceField,
    canonicalField: m.canonicalField ?? null,
    canonicalFieldLabel: m.canonicalFieldLabel ?? null,
    confidenceScore: m.confidenceScore,
    aiReasoning: m.aiReasoning ?? null,
    isApproved: m.isApproved,
    isOverridden: m.isOverridden,
    sampleValues: m.sampleValues ?? null,
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/ingestion-jobs/:id/field-mappings", async (req, res): Promise<void> => {
  const params = ListFieldMappingsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const mappings = await db
    .select()
    .from(fieldMappingsTable)
    .where(eq(fieldMappingsTable.ingestionJobId, params.data.id))
    .orderBy(fieldMappingsTable.id);

  res.json(mappings.map(formatMapping));
});

router.put("/ingestion-jobs/:id/field-mappings", async (req, res): Promise<void> => {
  const params = UpdateFieldMappingsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateFieldMappingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updated = [];
  for (const m of parsed.data.mappings) {
    const updateData: Partial<typeof fieldMappingsTable.$inferInsert> = {
      isApproved: m.isApproved,
    };
    if (m.canonicalField !== undefined) {
      updateData.canonicalField = m.canonicalField;
      updateData.isOverridden = true;
    }

    const [result] = await db
      .update(fieldMappingsTable)
      .set(updateData)
      .where(
        and(
          eq(fieldMappingsTable.id, m.id),
          eq(fieldMappingsTable.ingestionJobId, params.data.id)
        )
      )
      .returning();

    if (result) updated.push(formatMapping(result));
  }

  res.json(updated);
});

export default router;
