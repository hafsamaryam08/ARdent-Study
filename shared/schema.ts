import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  email: text("email").unique(),
  learningStyle: text("learning_style"),
  avatarUrl: text("avatar_url"),
  role: text("role").default("student"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scannedContent = pgTable("scanned_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  extractedText: text("extracted_text").notNull(),
  imageUrl: text("image_url"),
  concepts: text("concepts").array(),
  metadata: jsonb("metadata"), // For AR Blueprints
  createdAt: timestamp("created_at").defaultNow(),
});

export const concepts = pgTable("concepts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  term: text("term").notNull(),
  definition: text("definition").notNull(),
  category: text("category"),
  difficulty: text("difficulty"),
  relatedConcepts: text("related_concepts").array(),
  multimediaResources: jsonb("multimedia_resources"),
  annotations: jsonb("annotations"), // For AR Labels
  proceduralData: jsonb("procedural_data"), // Real-time 3D Primitives
  modelUrl: text("model_url"),
  modelStatus: text("model_status"),
  modelTaskId: text("model_task_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  conceptId: varchar("concept_id"),
  questions: jsonb("questions").notNull(),
  score: integer("score"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const learningProgress = pgTable("learning_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  conceptId: varchar("concept_id").notNull(),
  masteryLevel: integer("mastery_level").default(0),
  lastReviewed: timestamp("last_reviewed"),
  nextReview: timestamp("next_review"),
  reviewCount: integer("review_count").default(0),
});

export const knowledgeGraphNodes = pgTable("knowledge_graph_nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conceptId: varchar("concept_id").notNull(),
  position: jsonb("position"),
  connections: text("connections").array(),
  userId: varchar("user_id"),
});

export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { mode: "date" }).notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertScannedContentSchema = createInsertSchema(scannedContent).omit({
  id: true,
  createdAt: true,
});

export const insertConceptSchema = createInsertSchema(concepts).omit({
  id: true,
  createdAt: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export const insertLearningProgressSchema = createInsertSchema(learningProgress).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ScannedContent = typeof scannedContent.$inferSelect;
export type Concept = typeof concepts.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type LearningProgress = typeof learningProgress.$inferSelect;
export type KnowledgeGraphNode = typeof knowledgeGraphNodes.$inferSelect;
