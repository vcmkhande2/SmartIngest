import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, creditUnionsTable, ingestionJobsTable } from "@workspace/db";
import {
  CreateCreditUnionBody,
  UpdateCreditUnionBody,
  GetCreditUnionParams,
  UpdateCreditUnionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/credit-unions", async (req, res): Promise<void> => {
  const unions = await db
    .select()
    .from(creditUnionsTable)
    .orderBy(creditUnionsTable.createdAt);

  const result = unions.map((u) => ({
    ...u,
    totalJobsRun: u.totalJobsRun ?? 0,
    lastIngestionAt: u.lastIngestionAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));
  res.json(result);
});

router.post("/credit-unions", async (req, res): Promise<void> => {
  const parsed = CreateCreditUnionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [u] = await db
    .insert(creditUnionsTable)
    .values({
      name: parsed.data.name,
      contactEmail: parsed.data.contactEmail,
      contactName: parsed.data.contactName ?? null,
      status: parsed.data.status ?? "onboarding",
    })
    .returning();

  res.status(201).json({
    ...u,
    totalJobsRun: u.totalJobsRun ?? 0,
    lastIngestionAt: u.lastIngestionAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  });
});

router.get("/credit-unions/:id", async (req, res): Promise<void> => {
  const params = GetCreditUnionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [u] = await db
    .select()
    .from(creditUnionsTable)
    .where(eq(creditUnionsTable.id, params.data.id));

  if (!u) {
    res.status(404).json({ error: "Credit union not found" });
    return;
  }

  res.json({
    ...u,
    totalJobsRun: u.totalJobsRun ?? 0,
    lastIngestionAt: u.lastIngestionAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  });
});

router.patch("/credit-unions/:id", async (req, res): Promise<void> => {
  const params = UpdateCreditUnionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCreditUnionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof creditUnionsTable.$inferInsert> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.contactEmail != null) updateData.contactEmail = parsed.data.contactEmail;
  if (parsed.data.contactName !== undefined) updateData.contactName = parsed.data.contactName;
  if (parsed.data.status != null) updateData.status = parsed.data.status;

  const [u] = await db
    .update(creditUnionsTable)
    .set(updateData)
    .where(eq(creditUnionsTable.id, params.data.id))
    .returning();

  if (!u) {
    res.status(404).json({ error: "Credit union not found" });
    return;
  }

  res.json({
    ...u,
    totalJobsRun: u.totalJobsRun ?? 0,
    lastIngestionAt: u.lastIngestionAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  });
});

export default router;
