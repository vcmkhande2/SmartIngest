import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dataQualityRulesTable = pgTable("data_quality_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  field: text("field").notNull(),
  ruleType: text("rule_type").notNull(),
  severity: text("severity").notNull().default("soft"),
  ruleConfig: text("rule_config").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDataQualityRuleSchema = createInsertSchema(dataQualityRulesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDataQualityRule = z.infer<typeof insertDataQualityRuleSchema>;
export type DataQualityRule = typeof dataQualityRulesTable.$inferSelect;
