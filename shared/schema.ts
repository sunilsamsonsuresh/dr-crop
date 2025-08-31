import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const analyses = pgTable("analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  imagePath: text("image_path").notNull(),
  disease: text("disease").notNull(),
  severity: text("severity").notNull(),
  severityPercent: integer("severity_percent").notNull(),
  organicDiagnosis: text("organic_diagnosis").notNull(),
  chemicalDiagnosis: text("chemical_diagnosis").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  analyses: many(analyses),
}));

export const analysesRelations = relations(analyses, ({ one }) => ({
  user: one(users, {
    fields: [analyses.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true,
});

export const analysisResultSchema = z.object({
  disease: z.string(),
  severity: z.string(),
  severity_percent: z.number(),
  organic_diagnosis: z.string(),
  chemical_diagnosis: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;

export type UserStats = {
  scansToday: number;
  healthyPlants: number;
  needTreatment: number;
  criticalCases: number;
};
