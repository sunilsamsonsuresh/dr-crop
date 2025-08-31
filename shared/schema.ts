import { z } from "zod";
import { ObjectId } from "mongodb";

// MongoDB User Schema
export interface User {
  _id?: ObjectId;
  id: string;
  username: string;
  password: string;
  createdAt: Date;
}

// MongoDB Analysis Schema
export interface Analysis {
  _id?: ObjectId;
  id: string;
  userId: string;
  imagePath: string;
  disease: string;
  severity: string;
  severityPercent: number;
  organicDiagnosis: string;
  chemicalDiagnosis: string;
  createdAt: Date;
}

// Zod schemas for validation
export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertAnalysisSchema = z.object({
  userId: z.string(),
  imagePath: z.string(),
  disease: z.string(),
  severity: z.string(),
  severityPercent: z.number(),
  organicDiagnosis: z.string(),
  chemicalDiagnosis: z.string(),
});

export const analysisResultSchema = z.object({
  disease: z.string(),
  severity: z.string(),
  severity_percent: z.number(),
  organic_diagnosis: z.string(),
  chemical_diagnosis: z.string(),
});

// TypeScript types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;

export type UserStats = {
  scansToday: number;
  healthyPlants: number;
  needTreatment: number;
  criticalCases: number;
};