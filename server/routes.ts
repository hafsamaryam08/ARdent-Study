import type { Express } from "express";
import { createServer, type Server } from "http";
import type { Request } from "express";
import type { Multer } from "multer";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.patch("/api/auth/profile", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { fullName, email, password, learningStyle, avatarUrl } = req.body;
    const updates: any = {};

    if (fullName) updates.fullName = fullName;
    if (email) updates.email = email;
    if (learningStyle) updates.learningStyle = learningStyle;
    if (avatarUrl) updates.avatarUrl = avatarUrl;

    if (password) {
      updates.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const user = await storage.updateUser(req.session.userId, updates);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // ===== SCAN CONTENT / OCR ROUTES =====
  app.post("/api/scan/upload", upload.single("file"), async (req: Request, res: any) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: "Invalid file type. Only PNG, JPG, and PDF allowed." });
      }

      if (req.file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "File too large. Max 10MB." });
      }

      // Get extracted text and concepts from frontend (processed via Tesseract.js)
      let extractedText = req.body.extractedText || req.file.originalname || "Scanned content";
      let concepts: string[] = [];
      
      try {
        concepts = req.body.concepts ? JSON.parse(req.body.concepts) : [];
      } catch {
        concepts = [];
      }

      if (!extractedText || extractedText.length === 0) {
        return res.status(400).json({ message: "No text extracted from image" });
      }

      const scannedContent = await storage.createScannedContent({
        userId: req.session.userId,
        title: req.file.originalname || "Scanned Content",
        extractedText,
        concepts,
        imageUrl: null,
      });

      // Save each concept as a concept record for AR/Graph visualization
      const savedConcepts = [];
      for (const conceptName of concepts) {
        try {
          const existingConcept = await storage.getConceptByTerm(conceptName);
          if (!existingConcept) {
            const definition = extractDefinitionFromText(extractedText, conceptName);
            // Check category for both the full text AND the individual concept/definition
            let category = inferCategory(extractedText);
            if (category === "General") {
              // Try inferring from just the concept term and its definition
              category = inferCategory(conceptName + " " + definition);
            }
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
        } catch (e) {
          console.error("Failed to create concept:", conceptName, e);
        }
      }

      res.json({
        id: scannedContent.id,
        extractedText,
        concepts,
        savedConcepts: savedConcepts.map(c => ({ id: c.id, term: c.term })),
        confidence: 0.85,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Upload failed" });
    }
  });

  // ===== CONCEPTS ROUTES =====
  app.get("/api/concepts", async (req, res) => {
    try {
      const allConcepts = await storage.getAllConcepts();
      res.json(allConcepts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== KNOWLEDGE GRAPH ROUTES =====
  app.get("/api/knowledge-graph", async (req, res) => {
    try {
      const allConcepts = await storage.getAllConcepts();
      
      // Build graph nodes from concepts
      const nodes = allConcepts.map((c: any) => ({
        id: c.id,
        label: c.term,
        category: c.category || "General",
        definition: c.definition,
      }));

      // Create intelligent connections between concepts
      const edges = [];
      const edgeSet = new Set<string>();

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const node1 = nodes[i];
          const node2 = nodes[j];
          let shouldConnect = false;

          // 1. Same category - strong connection
          if (node1.category === node2.category) {
            shouldConnect = true;
          }

          // 2. Related terms in definition - strong connection
          if (node1.definition && node2.definition) {
            const def1Lower = node1.definition.toLowerCase();
            const def2Lower = node2.definition.toLowerCase();
            
            // Check if term appears in definition
            if (def1Lower.includes(node2.label.toLowerCase()) || 
                def2Lower.includes(node1.label.toLowerCase())) {
              shouldConnect = true;
            }

            // 3. Common important words (length > 4)
            const words1 = def1Lower.split(/[\s,;.()]+/).filter((w: string) => w.length > 4);
            const words2 = def2Lower.split(/[\s,;.()]+/).filter((w: string) => w.length > 4);
            const commonWords = words1.filter((w: string) => words2.includes(w));
            
            if (commonWords.length >= 2) {
              shouldConnect = true;
            }
          }

          // 4. Related concepts stored in database
          if (node1.relatedConcepts && Array.isArray(node1.relatedConcepts)) {
            if (node1.relatedConcepts.some((rc: any) => 
              (typeof rc === 'string' && rc.toLowerCase() === node2.label.toLowerCase()) || 
              (typeof rc === 'object' && rc.id === node2.id)
            )) {
              shouldConnect = true;
            }
          }

          // Avoid duplicate edges
          const edgeKey = [node1.id, node2.id].sort().join("-");
          if (shouldConnect && !edgeSet.has(edgeKey)) {
            edges.push({ source: node1.id, target: node2.id });
            edgeSet.add(edgeKey);
          }
        }
      }

      res.json({ nodes, edges });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== AR MODEL ROUTES =====
  app.get("/api/ar/models", async (req, res) => {
    try {
      const allConcepts = await storage.getAllConcepts();
      
      const models = allConcepts.map((c: any) => ({
        id: c.id,
        title: c.term,
        category: c.category || "General",
        description: c.definition,
        modelType: getModelTypeForCategory(c.category),
        thumbnail: "https://via.placeholder.com/300x300?text=" + encodeURIComponent(c.term),
      }));

      res.json(models);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/ar/models/:id", async (req, res) => {
    try {
      const concept = await storage.getConcept(req.params.id);
      if (!concept) {
        return res.status(404).json({ message: "Concept not found" });
      }

      res.json({
        id: concept.id,
        title: concept.term,
        description: concept.definition,
        category: concept.category,
        modelType: getModelTypeForCategory(concept.category),
        modelUrl: `/3d-models/${concept.category?.toLowerCase()}-${concept.id}.glb`,
        annotations: extractAnnotations(concept.definition),
        components: getComponentsForTerm(concept.term, concept.definition),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ar/models/generate", async (req, res) => {
    try {
      const { conceptTerm, category } = req.body;
      
      res.json({
        success: true,
        modelUrl: `/3d-models/generated-${Date.now()}.glb`,
        generatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/concepts/:id", async (req, res) => {
    try {
      const concept = await storage.getConcept(req.params.id);
      if (!concept) {
        return res.status(404).json({ message: "Concept not found" });
      }
      res.json(concept);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/concepts", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { term, definition, category, difficulty, relatedConcepts } = req.body;

      let enhancements: any = {};
      try {
        const pythonApiUrl = process.env.PYTHON_API_URL || "http://localhost:8000";
        const aiResponse = await global.fetch(`${pythonApiUrl}/api/ai/enhance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concepts: [term] }),
        });
        if (aiResponse.ok) {
          const aiData = await aiResponse.json() as any;
          enhancements = aiData[term] || {};
        }
      } catch (e) {
        // AI service unavailable - proceed with user-provided definition
      }

      const concept = await storage.createConcept({
        term,
        definition: definition || (enhancements.definition as string) || "",
        category,
        difficulty,
        relatedConcepts: relatedConcepts || [],
        multimediaResources: (enhancements.multimedia_resources as any) || [],
      });

      res.json(concept);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== QUIZ ROUTES =====
  app.get("/api/quizzes", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const quizzes = await storage.getUserQuizzes(req.session.userId);
      res.json(quizzes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/quizzes/generate", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { conceptId, title } = req.body;

      // Get concept
      const concept = await storage.getConcept(conceptId);
      if (!concept) {
        return res.status(404).json({ message: "Concept not found" });
      }

      // Generate questions using OpenAI
      let questions: any[] = [];
      try {
        if (!openai) {
          throw new Error("OpenAI not configured");
        }
        const prompt = `Generate 5 multiple choice quiz questions about "${concept.term}". 
Definition: ${concept.definition}
Category: ${concept.category || "General"}

Return a JSON object with a "questions" array. Each question object should have:
- "question": the question text
- "options": array of 4 answer choices
- "correct_answer": the correct option text (matching one of the options exactly)
- "explanation": brief explanation of the answer

Example format: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": "A", "explanation": "..."}]}`;

        const response = await openai.chat.completions.create({
          model: "gpt-5",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content || "{}";
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(content);
        } catch {
          parsedResponse = { questions: [] };
        }
        
        const parsedQuestions = parsedResponse.questions || parsedResponse.quiz || [];
        
        questions = parsedQuestions.slice(0, 5).map((q: any) => ({
          question: q.question || "Question",
          options: Array.isArray(q.options) ? q.options : ["A", "B", "C", "D"],
          correct_answer: q.correct_answer || q.correctAnswer || q.answer || (q.options?.[0] || "A"),
          explanation: q.explanation || "See the concept definition for more details.",
        }));
      } catch (e: any) {
        console.error("OpenAI error:", e);
        questions = generateFallbackQuestions(concept);
      }
      
      if (questions.length === 0) {
        questions = generateFallbackQuestions(concept);
      }

      // Save quiz
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

  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/quizzes/:id/submit", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { answers } = req.body;
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Calculate score
      let score = 0;
      const questions = quiz.questions as any;
      for (let i = 0; i < questions.length; i++) {
        if (answers[i] === questions[i].correct_answer) {
          score++;
        }
      }

      // Update quiz
      const percentage = Math.round((score / questions.length) * 100);
      await storage.updateQuiz(req.params.id, {
        score: percentage,
        completed: true,
      });

      // Update learning progress
      if (quiz.conceptId) {
        const progress = await storage.getProgress(req.session.userId, quiz.conceptId);
        const newReviewCount = (progress?.reviewCount || 0) + 1;
        const masteryLevel = Math.min(5, Math.floor(percentage / 20));

        await storage.upsertProgress({
          userId: req.session.userId,
          conceptId: quiz.conceptId,
          id: progress?.id || uuidv4(),
          reviewCount: newReviewCount,
          masteryLevel,
          lastReviewed: new Date(),
          nextReview: calculateNextReviewDate(newReviewCount, masteryLevel),
        });
      }

      res.json({ score: percentage, total: questions.length });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== LEARNING PROGRESS ROUTES =====
  app.get("/api/progress", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const progress = await storage.getUserProgress(req.session.userId);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/progress/due", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const due = await storage.getDueForReview(req.session.userId);
      res.json(due);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== DASHBOARD STATS =====
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const scanned = await storage.getUserScannedContent(req.session.userId);
      const quizzes = await storage.getUserQuizzes(req.session.userId);
      const progress = await storage.getUserProgress(req.session.userId);

      res.json({
        scannedPages: scanned.length,
        conceptsLearned: progress.length,
        quizzesCompleted: quizzes.filter((q: any) => q.completed).length,
        currentStreak: 7,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

// ===== HELPER FUNCTIONS =====
function extractConcepts(text: string): string[] {
  // Extract key terms: nouns, noun phrases, and technical terms
  const sentences = text.split(/[.!?]+/);
  const concepts = new Set<string>();
  
  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/).filter(w => w.length > 2);
    
    // Extract capitalized terms (likely proper nouns/concepts)
    for (let i = 0; i < words.length; i++) {
      if (words[i][0] === words[i][0].toUpperCase() && /[a-zA-Z]/.test(words[i][0])) {
        const term = words.slice(i, Math.min(i + 3, words.length)).join(" ");
        if (term.length > 3 && !term.match(/^[A-Z]\.$/)) {
          concepts.add(term);
        }
      }
    }

    // Extract noun phrases (consecutive capitalized words or key terms)
    for (let i = 0; i < words.length - 1; i++) {
      if (/^[A-Z]/.test(words[i])) {
        const phrase = words.slice(i, Math.min(i + 2, words.length)).join(" ");
        concepts.add(phrase);
      }
    }
  }
  
  return Array.from(concepts).slice(0, 10);
}

function extractAnnotations(text: string): any[] {
  // Extract key points from definition for AR annotations
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  return sentences.slice(0, 4).map((s, i) => ({
    id: `annotation-${i}`,
    text: s.trim(),
    position: { x: -1 + i * 0.5, y: 1, z: 0 },
  }));
}

function getComponentsForTerm(term: string, definition?: string): any[] {
  const componentMap: { [key: string]: any[] } = {
    "DNA": [
      { name: "Phosphate Group", color: "#FF6B6B" },
      { name: "Sugar Molecule", color: "#4ECDC4" },
      { name: "Nucleotide Base", color: "#45B7D1" },
      { name: "Hydrogen Bond", color: "#FFA07A" },
    ],
    "Cell": [
      { name: "Nucleus", color: "#FF6B6B" },
      { name: "Mitochondria", color: "#4ECDC4" },
      { name: "Cell Membrane", color: "#45B7D1" },
      { name: "Cytoplasm", color: "#FFA07A" },
    ],
    "Heart": [
      { name: "Left Atrium", color: "#FF6B6B" },
      { name: "Right Atrium", color: "#4ECDC4" },
      { name: "Left Ventricle", color: "#45B7D1" },
      { name: "Right Ventricle", color: "#FFA07A" },
    ],
    "Atom": [
      { name: "Proton", color: "#FF6B6B" },
      { name: "Neutron", color: "#4ECDC4" },
      { name: "Electron", color: "#45B7D1" },
      { name: "Nucleus", color: "#FFA07A" },
    ],
    "Algorithm": [
      { name: "Input", color: "#FF6B6B" },
      { name: "Processing", color: "#4ECDC4" },
      { name: "Logic", color: "#45B7D1" },
      { name: "Output", color: "#FFA07A" },
    ],
    "Database": [
      { name: "Tables", color: "#FF6B6B" },
      { name: "Queries", color: "#4ECDC4" },
      { name: "Indexes", color: "#45B7D1" },
      { name: "Constraints", color: "#FFA07A" },
    ],
    "Brain": [
      { name: "Cerebrum", color: "#FF6B6B" },
      { name: "Cerebellum", color: "#4ECDC4" },
      { name: "Brainstem", color: "#45B7D1" },
      { name: "Neurons", color: "#FFA07A" },
    ],
    "Muscle": [
      { name: "Fiber", color: "#FF6B6B" },
      { name: "Actin", color: "#4ECDC4" },
      { name: "Myosin", color: "#45B7D1" },
      { name: "Sarcomere", color: "#FFA07A" },
    ],
  };

  for (const key in componentMap) {
    if (term.toUpperCase().includes(key.toUpperCase())) {
      return componentMap[key];
    }
  }

  // Extract meaningful components from definition text
  if (definition) {
    const words = definition
      .split(/[\s,;.()]+/)
      .filter(w => w.length > 4 && !["which", "that", "this", "with", "from", "into", "through"].includes(w.toLowerCase()));
    const uniqueWords = [...new Set(words)].slice(0, 4);
    
    if (uniqueWords.length >= 3) {
      const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"];
      return uniqueWords.map((word, i) => ({
        name: word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        color: colors[i % colors.length],
      }));
    }
  }

  // Fallback generic components
  return [
    { name: "Structure", color: "#FF6B6B" },
    { name: "Function", color: "#4ECDC4" },
    { name: "Properties", color: "#45B7D1" },
    { name: "Applications", color: "#FFA07A" },
  ];
}

function getModelTypeForCategory(category?: string): string {
  if (!category) return "generic-model";
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes("biology")) return "organic-structure";
  if (categoryLower.includes("chemistry")) return "molecular-model";
  if (categoryLower.includes("physics")) return "motion-simulator";
  if (categoryLower.includes("math")) return "geometric-shape";
  if (categoryLower.includes("ai") || categoryLower.includes("ml")) return "neural-network";
  if (categoryLower.includes("software")) return "system-architecture";
  if (categoryLower.includes("data")) return "data-visualization";
  if (categoryLower.includes("database")) return "data-structure";
  if (categoryLower.includes("web")) return "web-component";
  if (categoryLower.includes("cinematography") || categoryLower.includes("film")) return "motion-simulator";
  if (categoryLower.includes("hardware")) return "organic-structure";
  return "generic-model";
}

function inferCategory(text: string): string {
  const textLower = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;
  
  // Hardware/Computer (CHECK FIRST - most specific)
  if (textLower.includes("computer") || textLower.includes("hardware") || textLower.includes("cpu") ||
      textLower.includes("processor") || textLower.includes("monitor") || textLower.includes("keyboard") ||
      textLower.includes("circuit") || textLower.includes("motherboard") || textLower.includes("gpu") ||
      textLower.includes("memory") || textLower.includes("ram") || textLower.includes("storage")) {
    return "Hardware";
  }
  
  // DNA (CHECK EARLY - most specific)
  if (textLower.includes("dna") || textLower.includes("helix") || textLower.includes("gene") ||
      textLower.includes("chromosome") || textLower.includes("nucleotide") || textLower.includes("genetic")) {
    return "Biology";
  }
  
  // Heart (CHECK EARLY - most specific)
  if (textLower.includes("heart") || textLower.includes("cardiac") || textLower.includes("ventricle") || 
      textLower.includes("atrium") || textLower.includes("valve") || textLower.includes("blood") ||
      textLower.includes("artery") || textLower.includes("vein") || textLower.includes("cardiovascular") ||
      textLower.includes("circulation") || textLower.includes("chamber") || textLower.includes("myocardium") ||
      textLower.includes("endocardium") || textLower.includes("pericardium")) {
    return "Biology";
  }
  
  if (textLower.includes("cell") || textLower.includes("organism") || 
      textLower.includes("photosynthesis") || textLower.includes("biology") ||
      textLower.includes("lung") || textLower.includes("liver") || textLower.includes("brain") || 
      textLower.includes("kidney") || textLower.includes("muscle") || textLower.includes("bone") || 
      textLower.includes("neuron") || textLower.includes("enzyme") || textLower.includes("protein") || 
      textLower.includes("amino") || textLower.includes("anatomy") || textLower.includes("organ") || 
      textLower.includes("tissue") || textLower.includes("mitochondria")) {
    return "Biology";
  }
  
  // AI & Machine Learning
  if (textLower.includes("algorithm") || textLower.includes("machine learning") || textLower.includes("neural") || 
      textLower.includes("training") || textLower.includes("ai") || 
      textLower.includes("artificial intelligence") || textLower.includes("deep learning")) {
    return "AI & ML";
  }
  
  // Chemistry
  if (textLower.includes("atom") || textLower.includes("molecule") || textLower.includes("element") || 
      textLower.includes("reaction") || textLower.includes("chemistry") || textLower.includes("bond") ||
      textLower.includes("compound") || textLower.includes("ion") || textLower.includes("periodic")) {
    return "Chemistry";
  }
  
  // Physics
  if (textLower.includes("force") || textLower.includes("motion") || textLower.includes("energy") || 
      textLower.includes("wave") || textLower.includes("physics") || textLower.includes("gravity") ||
      textLower.includes("velocity") || textLower.includes("acceleration") || textLower.includes("momentum")) {
    return "Physics";
  }
  
  // Mathematics
  if (textLower.includes("equation") || textLower.includes("theorem") || textLower.includes("formula") || 
      textLower.includes("geometry") || textLower.includes("mathematics") || textLower.includes("calculus") ||
      textLower.includes("integral") || textLower.includes("derivative") || textLower.includes("matrix")) {
    return "Mathematics";
  }
  
  // Software Engineering
  if (textLower.includes("design pattern") || textLower.includes("architecture") || textLower.includes("software") ||
      textLower.includes("development") || textLower.includes("code") || textLower.includes("framework") ||
      textLower.includes("library") || textLower.includes("programming")) {
    return "Software Engineering";
  }
  
  // Data Science
  if (textLower.includes("data") || textLower.includes("analysis") || textLower.includes("statistics") ||
      textLower.includes("visualization") || textLower.includes("dataset") || textLower.includes("analytics")) {
    return "Data Science";
  }
  
  // Databases
  if (textLower.includes("database") || textLower.includes("sql") || textLower.includes("query") ||
      textLower.includes("table") || textLower.includes("index") || textLower.includes("relational")) {
    return "Databases";
  }
  
  // Web Development
  if (textLower.includes("html") || textLower.includes("css") || textLower.includes("javascript") ||
      textLower.includes("react") || textLower.includes("web") || textLower.includes("frontend") || 
      textLower.includes("backend")) {
    return "Web Development";
  }

  // Arts & Media (Cinematography, Film, Video, Photography, etc.)
  if (textLower.includes("cinematography") || textLower.includes("film") || textLower.includes("video") ||
      textLower.includes("camera") || textLower.includes("shot") || textLower.includes("frame") ||
      textLower.includes("lighting") || textLower.includes("editing") || textLower.includes("director") ||
      textLower.includes("production") || textLower.includes("photography") || textLower.includes("composition") ||
      textLower.includes("lens") || textLower.includes("exposure") || textLower.includes("color grading")) {
    return "Cinematography";
  }
  
  return "General";
}

function extractDefinitionFromText(text: string, term: string): string {
  // Find sentences containing the term and use them as definition
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  const relevantSentences = sentences.filter(s => s.toLowerCase().includes(term.toLowerCase()));
  
  if (relevantSentences.length > 0) {
    return relevantSentences.slice(0, 2).join(". ") + ".";
  }
  
  // Fallback to first meaningful sentences
  return sentences.slice(0, 3).join(". ") + ".";
}

function calculateNextReviewDate(reviewCount: number, masteryLevel: number): Date {
  const intervals = [1, 3, 7, 14, 30, 60];
  const interval = intervals[Math.min(reviewCount, intervals.length - 1)];
  const adjustedInterval = interval * (1 + masteryLevel * 0.2);
  
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + adjustedInterval);
  return nextReview;
}

function generateFallbackQuestions(concept: any): any[] {
  const term = concept.term || "concept";
  const definition = concept.definition || "No definition available";
  const category = concept.category || "General";
  
  const shortDef = definition.length > 80 
    ? definition.substring(0, 80) + "..." 
    : definition;
  
  const correctOption1 = shortDef;
  const correctOption2 = category;
  const correctOption3 = category;
  const correctOption4 = "True";
  const correctOption5 = `A concept related to ${category}`;
  
  const questions = [
    {
      question: `What is the definition of ${term}?`,
      options: [correctOption1, "A process that cannot be defined", "An abstract concept with no real meaning", "None of the above"],
      correct_answer: correctOption1,
      explanation: `${term} is defined as: ${definition}`,
    },
    {
      question: `Which category does ${term} belong to?`,
      options: [correctOption2, "Philosophy", "Art History", "Linguistics"],
      correct_answer: correctOption2,
      explanation: `${term} is categorized under ${category}.`,
    },
    {
      question: `What field of study is ${term} most associated with?`,
      options: [correctOption3, "Ancient History", "Music Theory", "Culinary Arts"],
      correct_answer: correctOption3,
      explanation: `${term} is primarily studied in the field of ${category}.`,
    },
    {
      question: `True or False: ${term} is an important concept in ${category}.`,
      options: [correctOption4, "False", "Maybe", "Not applicable"],
      correct_answer: correctOption4,
      explanation: `${term} is indeed an important concept in ${category}.`,
    },
    {
      question: `Which of the following best describes ${term}?`,
      options: [correctOption5, "A cooking technique", "A type of musical instrument", "An ancient artifact"],
      correct_answer: correctOption5,
      explanation: `${term} is best described as a concept within ${category}.`,
    },
  ];
  
  return questions;
}
