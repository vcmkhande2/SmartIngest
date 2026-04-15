import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const creditUnionsTable = pgTable("credit_unions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactName: text("contact_name"),
  status: text("status").notNull().default("onboarding"),
  totalJobsRun: integer("total_jobs_run").notNull().default(0),
  lastIngestionAt: timestamp("last_ingestion_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCreditUnionSchema = createInsertSchema(creditUnionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCreditUnion = z.infer<typeof insertCreditUnionSchema>;
export type CreditUnion = typeof creditUnionsTable.$inferSelect;
