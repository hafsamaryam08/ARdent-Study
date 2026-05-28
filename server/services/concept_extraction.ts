import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Extracts 5 complete educational concepts from a paragraph of text.
 * @param text The source text to analyze.
 * @returns A JSON array of 5 logical concepts.
 */
export async function extractEducationalConcepts(text: string): Promise<string[]> {
  const modelNames = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
  
  const prompt = `
    Analyze the following educational text and identify the 5 most important core concepts.
    
    STRICT RULES:
    1. DO NOT return single keywords (e.g., "Heart", "Energy").
    2. DO return logical, complete educational concepts (e.g., "The Double Circulation System", "Law of Conservation of Energy").
    3. Return exactly 5 concepts.
    4. Return ONLY a valid JSON array of 5 strings.
    5. Ensure the concepts are academically accurate and central to the provided text.
    
    TEXT:
    ${text.substring(0, 2000)}
  `;

  for (const modelName of modelNames) {
    try {
      console.log(`[AI Extraction] Attempting with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      // Extract JSON array from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      
      const concepts = JSON.parse(jsonStr);
      
      if (Array.isArray(concepts) && concepts.length > 0) {
        console.log(`[AI Extraction] Success with ${modelName}:`, concepts);
        return concepts.slice(0, 5); // Ensure exactly 5
      }
    } catch (err: any) {
      console.error(`[AI Extraction] Model ${modelName} failed:`, err.message);
    }
  }

  // Fallback if AI fails completely
  console.log("[AI Extraction] All models failed. Using regex fallback.");
  const properNouns = text.match(/[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})*/g) || [];
  return Array.from(new Set(properNouns))
    .filter(w => w.length > 8)
    .slice(0, 5);
}
