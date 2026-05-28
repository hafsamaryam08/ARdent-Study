/**
 * Generates an AR visual blueprint using the NVIDIA Nemotron model via OpenRouter.
 * Uses text-only mode since Nemotron is not a multimodal model.
 * @param base64Image The base64 encoded image string (unused, kept for API compatibility).
 * @param extractedText The text extracted from local OCR.
 * @returns A JSON object containing mainSubject, backgroundElements, and interactiveLabels.
 */
export async function generateARBlueprint(base64Image: string, extractedText: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.includes("xxxx")) {
    console.error("CRITICAL: OPENROUTER_API_KEY is missing or invalid!");
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  console.log("NVIDIA PIPELINE: Initiating OpenRouter request...");
  console.log("NVIDIA PIPELINE: Model -> nvidia/llama-3.1-nemotron-70b-instruct");

  const prompt = `You are a Master 3D AR Architect. Given this textbook text:
"${extractedText}"

TASK:
1. Identify the concept: "${extractedText.slice(0, 50)}..."
2. Construct a HIGH-FIDELITY procedural 3D model using 10-15 basic primitives.
3. If it is ANATOMY (like Lungs, Heart, Brain):
   - Use pairs of shapes (e.g., two large elongated spheres for Lungs).
   - Use cylinders for tubes/vessels.
   - Use different colors for different structures (e.g., Red for arteries, Blue for veins).

Return ONLY JSON:
{
  "mainSubject": "Concept Name",
  "backgroundElements": ["..."],
  "interactiveLabels": ["..."],
  "procedural3D": [
    { "shape": "sphere" | "box" | "cylinder", "position": [x, y, z], "scale": [x, y, z], "color": "#hex", "label": "Structure Name" }
  ]
}

COORDINATES: x(-3 to 3), y(-3 to 3), z(-1 to 1).`;

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
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${JSON.stringify(errorData)}`);
    }

    const data: any = await response.json();
    let content = data.choices[0].message.content;
    
    // Robust JSON parsing: strip markdown code blocks if present
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // Try to extract JSON from the response even if there's surrounding text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in NVIDIA response");
    }
    
    const blueprint = JSON.parse(jsonMatch[0]);
    console.log("NVIDIA PIPELINE: Successfully generated blueprint:", {
      mainSubject: blueprint.mainSubject,
      labelCount: blueprint.interactiveLabels?.length || 0
    });
    return blueprint;
  } catch (error: any) {
    console.error("Error generating AR blueprint:", error.message);
    // Fallback blueprint if AI fails
    return {
      mainSubject: "Educational Concept",
      backgroundElements: ["Grid lines", "Data nodes", "Reference markers"],
      interactiveLabels: ["Core Definition", "Key Principle", "Practical Example", "Related Theory", "Application Context"]
    };
  }
}
