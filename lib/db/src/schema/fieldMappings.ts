import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fieldMappingsTable = pgTable("field_mappings", {
  id: serial("id").primaryKey(),
  ingestionJobId: integer("ingestion_job_id").notNull(),
  sourceField: text("source_field").notNull(),
  canonicalField: text("canonical_field"),
  canonicalFieldLabel: text("canonical_field_label"),
  confidenceScore: real("confidence_score").notNull().default(0),
  aiReasoning: text("ai_reasoning"),
  isApproved: boolean("is_approved").notNull().default(false),
  isOverridden: boolean("is_overridden").notNull().default(false),
  sampleValues: text("sample_values"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFieldMappingSchema = createInsertSchema(fieldMappingsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFieldMapping = z.infer<typeof insertFieldMappingSchema>;
export type FieldMapping = typeof fieldMappingsTable.$inferSelect;
