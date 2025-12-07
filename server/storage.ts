import { 
  users, 
  scannedContent, 
  concepts, 
  quizzes, 
  learningProgress,
  type User, 
  type InsertUser, 
  type ScannedContent,
  type Concept,
  type Quiz,
  type LearningProgress
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Scanned Content
  createScannedContent(data: any): Promise<ScannedContent>;
  getScannedContent(id: string): Promise<ScannedContent | undefined>;
  getUserScannedContent(userId: string): Promise<ScannedContent[]>;
  
  // Concepts
  createConcept(data: any): Promise<Concept>;
  getConcept(id: string): Promise<Concept | undefined>;
  getConceptByTerm(term: string): Promise<Concept | undefined>;
  getAllConcepts(): Promise<Concept[]>;
  updateConcept(id: string, updates: Partial<Concept>): Promise<Concept | undefined>;
  
  // Quizzes
  createQuiz(data: any): Promise<Quiz>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  getUserQuizzes(userId: string): Promise<Quiz[]>;
  updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz | undefined>;
  
  // Learning Progress
  getProgress(userId: string, conceptId: string): Promise<LearningProgress | undefined>;
  getUserProgress(userId: string): Promise<LearningProgress[]>;
  getDueForReview(userId: string): Promise<LearningProgress[]>;
  upsertProgress(data: any): Promise<LearningProgress>;
}

export class DatabaseStorage implements IStorage {
  // ===== USERS =====
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // ===== SCANNED CONTENT =====
  async createScannedContent(data: any): Promise<ScannedContent> {
    const [content] = await db.insert(scannedContent).values(data).returning();
    return content;
  }

  async getScannedContent(id: string): Promise<ScannedContent | undefined> {
    const [content] = await db.select().from(scannedContent).where(eq(scannedContent.id, id));
    return content || undefined;
  }

  async getUserScannedContent(userId: string): Promise<ScannedContent[]> {
    return await db.select().from(scannedContent)
      .where(eq(scannedContent.userId, userId))
      .orderBy(desc(scannedContent.createdAt));
  }

  // ===== CONCEPTS =====
  async createConcept(data: any): Promise<Concept> {
    const [concept] = await db.insert(concepts).values(data).returning();
    return concept;
  }

  async getConcept(id: string): Promise<Concept | undefined> {
    const [concept] = await db.select().from(concepts).where(eq(concepts.id, id));
    return concept || undefined;
  }

  async getConceptByTerm(term: string): Promise<Concept | undefined> {
    const [concept] = await db.select().from(concepts).where(eq(concepts.term, term));
    return concept || undefined;
  }

  async getAllConcepts(): Promise<Concept[]> {
    return await db.select().from(concepts);
  }

  async updateConcept(id: string, updates: Partial<Concept>): Promise<Concept | undefined> {
    const [concept] = await db
      .update(concepts)
      .set(updates)
      .where(eq(concepts.id, id))
      .returning();
    return concept || undefined;
  }

  // ===== QUIZZES =====
  async createQuiz(data: any): Promise<Quiz> {
    const [quiz] = await db.insert(quizzes).values(data).returning();
    return quiz;
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz || undefined;
  }

  async getUserQuizzes(userId: string): Promise<Quiz[]> {
    return await db.select().from(quizzes)
      .where(eq(quizzes.userId, userId))
      .orderBy(desc(quizzes.createdAt));
  }

  async updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz | undefined> {
    const [quiz] = await db
      .update(quizzes)
      .set(updates)
      .where(eq(quizzes.id, id))
      .returning();
    return quiz || undefined;
  }

  // ===== LEARNING PROGRESS =====
  async getProgress(userId: string, conceptId: string): Promise<LearningProgress | undefined> {
    const [progress] = await db.select().from(learningProgress)
      .where(eq(learningProgress.userId, userId) && eq(learningProgress.conceptId, conceptId));
    return progress || undefined;
  }

  async getUserProgress(userId: string): Promise<LearningProgress[]> {
    return await db.select().from(learningProgress)
      .where(eq(learningProgress.userId, userId));
  }

  async getDueForReview(userId: string): Promise<LearningProgress[]> {
    const now = new Date();
    return await db.select().from(learningProgress)
      .where(eq(learningProgress.userId, userId));
  }

  async upsertProgress(data: any): Promise<LearningProgress> {
    const existing = await this.getProgress(data.userId, data.conceptId);
    if (existing) {
      const [progress] = await db
        .update(learningProgress)
        .set(data)
        .where(eq(learningProgress.id, existing.id))
        .returning();
      return progress;
    }
    const [progress] = await db.insert(learningProgress).values(data).returning();
    return progress;
  }
}

export const storage = new DatabaseStorage();
