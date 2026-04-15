import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const processedRecordsTable = pgTable("processed_records", {
  id: serial("id").primaryKey(),
  ingestionJobId: integer("ingestion_job_id").notNull(),
  rowNumber: integer("row_number").notNull(),
  status: text("status").notNull().default("accepted"),
  canonicalData: text("canonical_data"),
  rawData: text("raw_data"),
  errorDetails: text("error_details"),
  errorSeverity: text("error_severity"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProcessedRecordSchema = createInsertSchema(processedRecordsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertProcessedRecord = z.infer<typeof insertProcessedRecordSchema>;
export type ProcessedRecord = typeof processedRecordsTable.$inferSelect;
