import { pgTable, text, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const canonicalFieldsTable = pgTable("canonical_fields", {
  id: serial("id").primaryKey(),
  fieldKey: text("field_key").notNull().unique(),
  label: text("label").notNull(),
  category: text("category").notNull(),
  dataType: text("data_type").notNull(),
  isRequired: boolean("is_required").notNull().default(false),
  description: text("description"),
});

export const insertCanonicalFieldSchema = createInsertSchema(canonicalFieldsTable).omit({
  id: true,
});
export type InsertCanonicalField = z.infer<typeof insertCanonicalFieldSchema>;
export type CanonicalField = typeof canonicalFieldsTable.$inferSelect;
