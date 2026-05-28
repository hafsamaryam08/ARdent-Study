import { client } from "@gradio/client";
import { storage } from "../storage";
import fs from "fs";
import path from "path";

// Library of high-quality scientific fallbacks
const REALISTIC_FALLBACKS: Record<string, string> = {
  "heart": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Heart/glTF-Binary/Heart.glb",
  "brain": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BrainStem/glTF-Binary/BrainStem.glb",
  "dna": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DNA/glTF-Binary/DNA.glb",
  "atom": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxInterleaved/glTF-Binary/BoxInterleaved.glb", // Placeholder for atom
  "neural": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BrainStem/glTF-Binary/BrainStem.glb",
  "network": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BrainStem/glTF-Binary/BrainStem.glb"
};

export async function handle3DGeneration(conceptId: string, term: string, category: string) {
  try {
    console.log(`Starting High-Fidelity 3D pipeline for: ${term} (${category})`);

    const hfToken = process.env.HUGGINGFACE_API_KEY;
    if (!hfToken) {
      throw new Error("HUGGINGFACE_API_KEY is not set");
    }

    // --- STAGE 1: TEXT TO IMAGE (Pollinations.ai - Free/No Token) ---
    console.log("Stage 1: Generating reference image via Pollinations.ai...");
    const imagePrompt = encodeURIComponent(`A high-fidelity 3D asset of ${term}, isolated on gray background, orthographic, 4k`);
    const referenceImageUrl = `https://pollinations.ai/p/${imagePrompt}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}&model=search`;

    console.log(`Reference image generated (URL): ${referenceImageUrl}`);

    // --- STAGE 2: IMAGE TO 3D (TripoSR) ---
    console.log("Stage 2: Reconstructing 3D mesh via TripoSR...");
    // Using full URL to bypass metadata resolution issues
    const tripoApp = await client("https://stabilityai-triposr.hf.space", {
      // @ts-ignore
      hf_token: hfToken
    });

    const tripoResult = await tripoApp.predict("/generate", [
      { url: referenceImageUrl }, // input_image
      true,                       // do_remove_background
      0.85,                       // foreground_ratio
    ]);

    const tripoData = tripoResult.data as any[];
    const fileData = tripoData[0];
    const remoteUrl = typeof fileData === 'string' ? fileData : fileData.url;

    if (!remoteUrl) {
      throw new Error("No 3D model URL found in TripoSR result");
    }

    console.log(`High-fidelity 3D Model generated at: ${remoteUrl}`);

    // --- STAGE 3: LOCAL PERSISTENCE ---
    const modelsDir = path.join(process.cwd(), "client", "public", "generated_models");
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }

    const fileName = `${conceptId}.glb`;
    const localPath = path.join(modelsDir, fileName);
    const publicUrl = `/generated_models/${fileName}`;

    console.log(`Downloading model from ${remoteUrl}...`);
    const downloadResponse = await fetch(remoteUrl);
    if (!downloadResponse.ok) {
      throw new Error(`Failed to download model: ${downloadResponse.status}`);
    }
    const arrayBuffer = await downloadResponse.arrayBuffer();
    fs.writeFileSync(localPath, Buffer.from(arrayBuffer));

    console.log(`Saved High-Fidelity 3D model locally to: ${localPath}`);

    // Update the database
    await storage.updateConcept(conceptId, {
      modelUrl: publicUrl,
      modelStatus: "completed"
    });

  } catch (error: any) {
    console.error("Error in high-fidelity 3D generation:", error.message);

    // If AI fails, we set status to failed.
    // The frontend ARVisualizerCanvas will automatically detect this and run our
    // custom procedural mathematical components (like DNA3D, CNN3D) instead!
    await storage.updateConcept(conceptId, {
      modelStatus: "failed",
      modelUrl: null
    });
  }
}
