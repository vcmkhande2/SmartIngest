import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ingestionJobsTable = pgTable("ingestion_jobs", {
  id: serial("id").primaryKey(),
  creditUnionId: integer("credit_union_id").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size"),
  fileContent: text("file_content"),
  status: text("status").notNull().default("uploaded"),
  totalRecords: integer("total_records"),
  processedRecords: integer("processed_records"),
  acceptedRecords: integer("accepted_records"),
  softErrorRecords: integer("soft_error_records"),
  hardErrorRecords: integer("hard_error_records"),
  mappingConfidenceAvg: real("mapping_confidence_avg"),
  errorSummary: text("error_summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertIngestionJobSchema = createInsertSchema(ingestionJobsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIngestionJob = z.infer<typeof insertIngestionJobSchema>;
export type IngestionJob = typeof ingestionJobsTable.$inferSelect;
