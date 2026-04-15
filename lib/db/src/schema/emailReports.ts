import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const emailReportsTable = pgTable("email_reports", {
  id: serial("id").primaryKey(),
  ingestionJobId: integer("ingestion_job_id").notNull().unique(),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  bodyHtml: text("body_html").notNull(),
  hardErrorCount: integer("hard_error_count").notNull().default(0),
  softErrorCount: integer("soft_error_count").notNull().default(0),
  status: text("status").notNull().default("draft"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEmailReportSchema = createInsertSchema(emailReportsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertEmailReport = z.infer<typeof insertEmailReportSchema>;
export type EmailReport = typeof emailReportsTable.$inferSelect;
