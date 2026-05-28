import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execPromise = promisify(exec);

/**
 * Executes local Tesseract OCR on an image file.
 * @param imagePath Absolute path to the image file.
 * @returns Cleaned text extracted from the image.
 */
export async function runLocalOCR(imagePath: string): Promise<string> {
  try {
    console.log(`[Local OCR] Processing: ${path.basename(imagePath)}`);
    
    // Command: Using absolute path to ensure it works even if PATH is finicky
    const tesseractPath = `"D:\\Tesseract-OCR\\tesseract.exe"`;
    const { stdout, stderr } = await execPromise(`${tesseractPath} "${imagePath}" stdout`);
    
    if (stderr && !stdout) {
      // Tesseract often logs info to stderr even on success, so we check if stdout is empty
      if (stderr.toLowerCase().includes("error")) {
        throw new Error(`Tesseract Error: ${stderr}`);
      }
    }

    // CLEANUP LOGIC:
    // 1. Remove non-printable characters
    // 2. Normalize whitespace (remove multiple spaces/newlines)
    // 3. Remove stray symbols common in OCR noise
    const cleanedText = stdout
      .replace(/[^\x20-\x7E\n]/g, "") // Remove non-ASCII
      .replace(/\r/g, "")             // Remove carriage returns
      .replace(/\n+/g, " ")           // Convert multiple newlines to single space
      .replace(/\s+/g, " ")           // Normalize multiple spaces
      .trim();

    return cleanedText || "No text could be extracted from this image.";
    
  } catch (error: any) {
    console.error("[Local OCR] Fatal failure:", error.message);
    throw new Error("Local OCR failed. Ensure Tesseract is installed and in your System PATH.");
  }
}
