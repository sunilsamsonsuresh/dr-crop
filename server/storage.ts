import { type User, type InsertUser, type Analysis, type InsertAnalysis, type UserStats } from "@shared/schema";
import { getDatabase } from "./db";
import { ObjectId } from "mongodb";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysesByUserId(userId: string): Promise<Analysis[]>;
  getAnalysis(id: string): Promise<Analysis | undefined>;
  getUserStats(userId: string): Promise<UserStats>;
  deleteUser(userId: string): Promise<void>;
  deleteAnalysis(analysisId: string, userId: string): Promise<void>;
  deleteAllUserAnalyses(userId: string): Promise<void>;
}

export class MongoStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const db = getDatabase();
    const user = await db.collection<User>('users').findOne({ id });
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = getDatabase();
    const user = await db.collection<User>('users').findOne({ username });
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const db = getDatabase();
    const user: User = {
      id: randomUUID(),
      username: insertUser.username,
      password: insertUser.password,
      createdAt: new Date(),
    };
    
    await db.collection<User>('users').insertOne(user);
    return user;
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const db = getDatabase();
    const analysis: Analysis = {
      id: randomUUID(),
      userId: insertAnalysis.userId,
      imagePath: insertAnalysis.imagePath,
      disease: insertAnalysis.disease,
      severity: insertAnalysis.severity,
      severityPercent: insertAnalysis.severityPercent,
      organicDiagnosis: insertAnalysis.organicDiagnosis,
      chemicalDiagnosis: insertAnalysis.chemicalDiagnosis,
      createdAt: new Date(),
    };
    
    await db.collection<Analysis>('analyses').insertOne(analysis);
    return analysis;
  }

  async getAnalysesByUserId(userId: string): Promise<Analysis[]> {
    const db = getDatabase();
    const analyses = await db.collection<Analysis>('analyses')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    return analyses;
  }

  async getAnalysis(id: string): Promise<Analysis | undefined> {
    const db = getDatabase();
    const analysis = await db.collection<Analysis>('analyses').findOne({ id });
    return analysis || undefined;
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const db = getDatabase();
    
    // Get today's date for filtering today's scans
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('Getting stats for user:', userId);
    console.log('Today date range:', today, 'to', tomorrow);

    // Get all user's analyses
    const userAnalyses = await db.collection<Analysis>('analyses')
      .find({ userId })
      .toArray();

    console.log('Total user analyses found:', userAnalyses.length);

    // Get today's scans using MongoDB date query
    const todayScansResult = await db.collection<Analysis>('analyses')
      .find({ 
        userId,
        createdAt: { $gte: today, $lt: tomorrow }
      })
      .toArray();

    console.log('Today scans found:', todayScansResult.length);

    // Calculate stats
    const scansToday = todayScansResult.length;
    
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

    const stats = {
      scansToday,
      healthyPlants,
      needTreatment,
      criticalCases
    };

    console.log('Calculated stats:', stats);
    return stats;
  }

  async deleteUser(userId: string): Promise<void> {
    const db = getDatabase();
    
    // Delete all user's analyses first
    await db.collection<Analysis>('analyses').deleteMany({ userId });
    
    // Delete the user
    await db.collection<User>('users').deleteOne({ id: userId });
  }

  async deleteAnalysis(analysisId: string, userId: string): Promise<void> {
    const db = getDatabase();
    
    // Delete analysis only if it belongs to the user
    await db.collection<Analysis>('analyses').deleteOne({ 
      id: analysisId, 
      userId 
    });
  }

  async deleteAllUserAnalyses(userId: string): Promise<void> {
    const db = getDatabase();
    
    // Delete all analyses for the user
    await db.collection<Analysis>('analyses').deleteMany({ userId });
  }
}

export const storage = new MongoStorage();