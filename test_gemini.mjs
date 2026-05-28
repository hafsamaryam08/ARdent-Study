import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function testGemini() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  
  try {
    // There is no direct listModels on genAI in this version of the SDK usually, 
    // it's on the client. But let's try a common model name.
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log("Success:", result.response.text());
  } catch (e) {
    console.error("Error:", e.message);
  }
}

testGemini();
