import { fetchUserLatestConcepts } from "../neo4j";

export async function generateLearningRecommendations(userId: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.includes("xxxx")) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  // 1. GRAPH-RAG: Fetch context from Neo4j
  const latestConcepts = await fetchUserLatestConcepts(userId);
  if (latestConcepts.length === 0) {
    return {
      recommendations: [
        { topic: "Fundamentals of Science", reason: "Start your journey by scanning your first textbook page." },
        { topic: "How ARdent-Study Works", reason: "Learn how to use augmented reality for better retention." },
        { topic: "Setting Learning Goals", reason: "Define your path for the semester." }
      ],
      graphInsight: "You haven't scanned any concepts yet. Your learning graph is waiting for its first connection!"
    };
  }

  const conceptSummary = latestConcepts.map(c => `${c.term} (${c.category})`).join(", ");

  // 2. LLM REASONING: Personalize based on graph history
  const prompt = `You are the ARdent Study AI Tutor. The user's Neo4j learning graph shows they recently studied these concepts: [${conceptSummary}]. 
  Do not generate general advice. You must return a strict JSON object with two keys: 
  recommendations (an array of 3 highly specific, advanced topics they should study next, with a short reason for each) 
  and graphInsight (a 2-sentence explanation of how their recently scanned topics connect to each other logically).`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:5000",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "nvidia/llama-3.1-nemotron-70b-instruct",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error("AI Tutor API failed");
    }

    const data: any = await response.json();
    let content = data.choices[0].message.content;
    
    // Clean markdown if present
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(content);
  } catch (error: any) {
    console.error("AI Tutor Error:", error.message);
    return {
      recommendations: [
        { topic: `Advanced ${latestConcepts[0].category}`, reason: "Deepen your understanding of your most recent topic." },
        { topic: "Cross-disciplinary Applications", reason: "Explore how these concepts apply to other fields." },
        { topic: "Practical Implementation", reason: "Move from theory to practice." }
      ],
      graphInsight: `Your studies in ${latestConcepts[0].term} form a strong foundation for advanced ${latestConcepts[0].category} analysis.`
    };
  }
}
