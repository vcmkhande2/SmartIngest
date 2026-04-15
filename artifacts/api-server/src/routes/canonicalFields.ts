import { Router, type IRouter } from "express";
import { db, canonicalFieldsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/canonical-fields", async (_req, res): Promise<void> => {
  const fields = await db
    .select()
    .from(canonicalFieldsTable)
    .orderBy(canonicalFieldsTable.category, canonicalFieldsTable.fieldKey);

  res.json(
    fields.map((f) => ({
      id: f.id,
      fieldKey: f.fieldKey,
      label: f.label,
      category: f.category,
      dataType: f.dataType,
      isRequired: f.isRequired,
      description: f.description ?? null,
    }))
  );
});

export default router;
