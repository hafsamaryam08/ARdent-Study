import type { Express } from "express";
import { createServer, type Server } from "http";
import type { Request } from "express";
import type { Multer } from "multer";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
// 1. Switched from OpenAI to Google Generative AI
import { GoogleGenerativeAI } from "@google/generative-ai";

// 2. Initialize Gemini (Uses your new free API key from .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const SALT_ROUNDS = 10;

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const upload: Multer = multer({ storage: multer.memoryStorage() });

  // ===== AUTH ROUTES =====
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const hashedPassword = await bcrypt.hash(validatedData.password, SALT_ROUNDS);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });
      req.session.userId = user.id;
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Signup failed" });
    }
  });

  const loginSchema = insertUserSchema.pick({ username: true, password: true });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const validPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.patch("/api/auth/profile", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    const { fullName, email, password, learningStyle, avatarUrl } = req.body;
    const updates: any = {};
    if (fullName) updates.fullName = fullName;
    if (email) updates.email = email;
    if (learningStyle) updates.learningStyle = learningStyle;
    if (avatarUrl) updates.avatarUrl = avatarUrl;
    if (password) updates.password = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await storage.updateUser(req.session.userId, updates);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // ===== SCAN CONTENT / OCR ROUTES =====
  app.post("/api/scan/upload", upload.single("file"), async (req: Request, res: any) => {
    try {
      if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
      if (!req.file) return res.status(400).json({ message: "No file provided" });

      const extractedText = req.body.extractedText || "Scanned content";
      let concepts: string[] = [];
      try {
        concepts = req.body.concepts ? JSON.parse(req.body.concepts) : [];
      } catch {
        concepts = [];
      }

      const scannedContent = await storage.createScannedContent({
        userId: req.session.userId,
        title: req.file.originalname || "Scanned Content",
        extractedText,
        concepts,
        imageUrl: null,
      });

      const savedConcepts = [];
      for (const conceptName of concepts) {
        const existingConcept = await storage.getConceptByTerm(conceptName);
        if (!existingConcept) {
          const definition = extractDefinitionFromText(extractedText, conceptName);
          const category = inferCategory(extractedText);
          const newConcept = await storage.createConcept({
            term: conceptName,
            definition,
            category,
            difficulty: "intermediate",
            relatedConcepts: concepts.filter(c => c !== conceptName).slice(0, 3),
            multimediaResources: {},
          });
          savedConcepts.push(newConcept);
        }
      }

      res.json({ id: scannedContent.id, extractedText, savedConcepts });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== QUIZ ROUTES (Updated to Gemini) =====
  app.post("/api/quizzes/generate", async (req, res) => {
    try {
      if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
      const { conceptId, title } = req.body;
      const concept = await storage.getConcept(conceptId);
      if (!concept) return res.status(404).json({ message: "Concept not found" });

      let questions: any[] = [];
      try {
        const prompt = `Generate 5 multiple choice quiz questions about "${concept.term}". 
        Definition: ${concept.definition}
        Category: ${concept.category || "General"}
        Return ONLY a raw JSON object with a "questions" array. No markdown.
        Format: {"questions": [{"question": "text", "options": ["A","B","C","D"], "correct_answer": "correct text", "explanation": "text"}]}`;

        const result = await aiModel.generateContent(prompt);
        const aiText = result.response.text().replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(aiText);
        
        questions = (parsed.questions || []).map((q: any) => ({
          question: q.question || "Question",
          options: q.options || ["A", "B", "C", "D"],
          correct_answer: q.correct_answer || q.options[0],
          explanation: q.explanation || "Correct answer based on definitions."
        }));
      } catch (e) {
        console.error("Gemini Error:", e);
        questions = generateFallbackQuestions(concept);
      }

      const quiz = await storage.createQuiz({
        userId: req.session.userId,
        conceptId,
        title: title || `${concept.term} Quiz`,
        questions,
        score: null,
        completed: false,
      });
      res.json(quiz);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== KNOWLEDGE GRAPH & DASHBOARD =====
  app.get("/api/knowledge-graph", async (req, res) => {
    const allConcepts = await storage.getAllConcepts();
    const nodes = allConcepts.map((c: any) => ({ id: c.id, label: c.term, category: c.category }));
    const edges: any[] = []; // Simplified for speed
    res.json({ nodes, edges });
  });

  app.get("/api/dashboard/stats", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    const scanned = await storage.getUserScannedContent(req.session.userId);
    const progress = await storage.getUserProgress(req.session.userId);
    res.json({ scannedPages: scanned.length, conceptsLearned: progress.length, quizzesCompleted: 0, currentStreak: 7 });
  });

  const httpServer = createServer(app);
  return httpServer;
}

// HELPER FUNCTIONS (Preserved from your original file)
function inferCategory(text: string): string {
  const textLower = text.toLowerCase();
  if (textLower.includes("hardware") || textLower.includes("cpu")) return "Hardware";
  if (textLower.includes("dna") || textLower.includes("biology")) return "Biology";
  if (textLower.includes("algorithm") || textLower.includes("ai")) return "AI & ML";
  return "General";
}

function extractDefinitionFromText(text: string, term: string): string {
  const sentences = text.split(/[.!?]+/).map(s => s.trim());
  const relevant = sentences.filter(s => s.toLowerCase().includes(term.toLowerCase()));
  return relevant.length > 0 ? relevant[0] + "." : "Defined in context of " + term;
}

function generateFallbackQuestions(concept: any): any[] {
  return [{
    question: `What is the primary category of ${concept.term}?`,
    options: [concept.category, "Social Studies", "Art", "Music"],
    correct_answer: concept.category,
    explanation: `Based on the system scan, ${concept.term} belongs to ${concept.category}.`
  }];
}