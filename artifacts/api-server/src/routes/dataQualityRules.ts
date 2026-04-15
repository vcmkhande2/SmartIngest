import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, dataQualityRulesTable } from "@workspace/db";
import {
  CreateDataQualityRuleBody,
  UpdateDataQualityRuleParams,
  UpdateDataQualityRuleBody,
  DeleteDataQualityRuleParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatRule(r: typeof dataQualityRulesTable.$inferSelect) {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    field: r.field,
    ruleType: r.ruleType,
    severity: r.severity,
    ruleConfig: r.ruleConfig,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

router.get("/data-quality-rules", async (_req, res): Promise<void> => {
  const rules = await db
    .select()
    .from(dataQualityRulesTable)
    .orderBy(dataQualityRulesTable.severity, dataQualityRulesTable.field);
  res.json(rules.map(formatRule));
});

router.post("/data-quality-rules", async (req, res): Promise<void> => {
  const parsed = CreateDataQualityRuleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [rule] = await db
    .insert(dataQualityRulesTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      field: parsed.data.field,
      ruleType: parsed.data.ruleType,
      severity: parsed.data.severity,
      ruleConfig: parsed.data.ruleConfig,
      isActive: parsed.data.isActive ?? true,
    })
    .returning();

  res.status(201).json(formatRule(rule));
});

router.patch("/data-quality-rules/:id", async (req, res): Promise<void> => {
  const params = UpdateDataQualityRuleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDataQualityRuleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof dataQualityRulesTable.$inferInsert> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.field != null) updateData.field = parsed.data.field;
  if (parsed.data.ruleType != null) updateData.ruleType = parsed.data.ruleType;
  if (parsed.data.severity != null) updateData.severity = parsed.data.severity;
  if (parsed.data.ruleConfig != null) updateData.ruleConfig = parsed.data.ruleConfig;
  if (parsed.data.isActive != null) updateData.isActive = parsed.data.isActive;

  const [rule] = await db
    .update(dataQualityRulesTable)
    .set(updateData)
    .where(eq(dataQualityRulesTable.id, params.data.id))
    .returning();

  if (!rule) {
    res.status(404).json({ error: "Rule not found" });
    return;
  }

  res.json(formatRule(rule));
});

router.delete("/data-quality-rules/:id", async (req, res): Promise<void> => {
  const params = DeleteDataQualityRuleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(dataQualityRulesTable)
    .where(eq(dataQualityRulesTable.id, params.data.id));

  res.sendStatus(204);
});

export default router;
