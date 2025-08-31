import { Collection, Db, ObjectId } from 'mongodb';
import { type User, type InsertUser, type Analysis, type InsertAnalysis, type UserStats } from "@shared/schema";
import { getDatabase } from './db';

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
  private db: Db | null = null;
  private usersCollection: Collection | null = null;
  private analysesCollection: Collection | null = null;

  private async ensureInitialized() {
    if (!this.db) {
      this.db = getDatabase();
      this.usersCollection = this.db.collection('users');
      this.analysesCollection = this.db.collection('analyses');
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      await this.ensureInitialized();
      const user = await this.usersCollection!.findOne({ id }) as User | null;
      return user || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      await this.ensureInitialized();
      const user = await this.usersCollection!.findOne({ username }) as User | null;
      return user || undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      await this.ensureInitialized();
      const id = new ObjectId().toString();
      const user: User = { 
        ...insertUser, 
        id,
        createdAt: new Date()
      };
      
      await this.usersCollection!.insertOne(user);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    try {
      await this.ensureInitialized();
      const id = new ObjectId().toString();
      const analysis: Analysis = { 
        ...insertAnalysis, 
        id,
        createdAt: new Date()
      };
      
      await this.analysesCollection!.insertOne(analysis);
      return analysis;
    } catch (error) {
      console.error('Error creating analysis:', error);
      throw new Error('Failed to create analysis');
    }
  }

  async getAnalysesByUserId(userId: string): Promise<Analysis[]> {
    try {
      await this.ensureInitialized();
      const analyses = await this.analysesCollection!
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray() as Analysis[];
      return analyses;
    } catch (error) {
      console.error('Error getting analyses by user ID:', error);
      return [];
    }
  }

  async getAnalysis(id: string): Promise<Analysis | undefined> {
    try {
      await this.ensureInitialized();
      const analysis = await this.analysesCollection!.findOne({ id }) as Analysis | null;
      return analysis || undefined;
    } catch (error) {
      console.error('Error getting analysis:', error);
      return undefined;
    }
  }

  async getUserStats(userId: string): Promise<UserStats> {
    try {
      await this.ensureInitialized();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [scansToday, allAnalyses] = await Promise.all([
        this.analysesCollection!.countDocuments({
          userId,
          createdAt: { $gte: today }
        }),
        this.analysesCollection!.find({ userId }).toArray()
      ]);

      const typedAnalyses = allAnalyses as unknown as Analysis[];

      const healthyPlants = typedAnalyses.filter(a => a.severity === 'None').length;
      const needTreatment = typedAnalyses.filter(a => a.severity === 'Mild' || a.severity === 'Moderate').length;
      const criticalCases = typedAnalyses.filter(a => a.severity === 'Severe').length;

      return {
        scansToday,
        healthyPlants,
        needTreatment,
        criticalCases
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        scansToday: 0,
        healthyPlants: 0,
        needTreatment: 0,
        criticalCases: 0
      };
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.ensureInitialized();
      await Promise.all([
        this.usersCollection!.deleteOne({ id: userId }),
        this.analysesCollection!.deleteMany({ userId })
      ]);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  async deleteAnalysis(analysisId: string, userId: string): Promise<void> {
    try {
      await this.ensureInitialized();
      const result = await this.analysesCollection!.deleteOne({ 
        id: analysisId, 
        userId 
      });
      
      if (result.deletedCount === 0) {
        throw new Error('Analysis not found or access denied');
      }
    } catch (error) {
      console.error('Error deleting analysis:', error);
      throw new Error('Failed to delete analysis');
    }
  }

  async deleteAllUserAnalyses(userId: string): Promise<void> {
    try {
      await this.ensureInitialized();
      await this.analysesCollection!.deleteMany({ userId });
    } catch (error) {
      console.error('Error deleting all user analyses:', error);
      throw new Error('Failed to delete all analyses');
    }
  }
}

export const mongoStorage = new MongoStorage();
