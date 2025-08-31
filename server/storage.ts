import { type User, type InsertUser, type Analysis, type InsertAnalysis, type UserStats } from "@shared/schema";
import { users, analyses } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, count, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysesByUserId(userId: string): Promise<Analysis[]>;
  getAnalysis(id: string): Promise<Analysis | undefined>;
  getUserStats(userId: string): Promise<UserStats>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const [analysis] = await db
      .insert(analyses)
      .values(insertAnalysis)
      .returning();
    return analysis;
  }

  async getAnalysesByUserId(userId: string): Promise<Analysis[]> {
    return await db
      .select()
      .from(analyses)
      .where(eq(analyses.userId, userId))
      .orderBy(sql`${analyses.createdAt} DESC`);
  }

  async getAnalysis(id: string): Promise<Analysis | undefined> {
    const [analysis] = await db.select().from(analyses).where(eq(analyses.id, id));
    return analysis || undefined;
  }

  async getUserStats(userId: string): Promise<UserStats> {
    // Get today's date for filtering today's scans
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all user's analyses
    const userAnalyses = await db
      .select()
      .from(analyses)
      .where(eq(analyses.userId, userId));

    // Get today's scans
    const todayScans = userAnalyses.filter(
      analysis => analysis.createdAt >= today
    );

    // Calculate stats
    const scansToday = todayScans.length;
    
    const healthyPlants = userAnalyses.filter(
      analysis => analysis.disease.toLowerCase().includes('healthy') || 
                 analysis.severityPercent <= 15
    ).length;

    const needTreatment = userAnalyses.filter(
      analysis => analysis.severityPercent > 15 && analysis.severityPercent <= 70
    ).length;

    const criticalCases = userAnalyses.filter(
      analysis => analysis.severityPercent > 70
    ).length;

    return {
      scansToday,
      healthyPlants,
      needTreatment,
      criticalCases
    };
  }
}

export const storage = new DatabaseStorage();
