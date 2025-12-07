export interface ExportData {
  version: string;
  exportedAt: string;
  user: {
    username: string;
    fullName?: string;
    learningStyle?: string;
  };
  concepts: any[];
  quizzes: any[];
  progress: any[];
  scannedContent: any[];
}

export async function exportUserData(): Promise<ExportData> {
  const [conceptsRes, quizzesRes, progressRes] = await Promise.all([
    fetch("/api/concepts", { credentials: "include" }),
    fetch("/api/quizzes", { credentials: "include" }),
    fetch("/api/progress", { credentials: "include" }),
  ]);

  const [concepts, quizzes, progress] = await Promise.all([
    conceptsRes.ok ? conceptsRes.json() : [],
    quizzesRes.ok ? quizzesRes.json() : [],
    progressRes.ok ? progressRes.json() : [],
  ]);

  const userRes = await fetch("/api/auth/me", { credentials: "include" });
  const user = userRes.ok ? await userRes.json() : {};

  return {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    user: {
      username: user.username || "unknown",
      fullName: user.fullName,
      learningStyle: user.learningStyle,
    },
    concepts,
    quizzes,
    progress,
    scannedContent: [],
  };
}

export function downloadAsJSON(data: ExportData, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadAsCSV(data: any[], filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (typeof value === "object") {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? "";
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importUserData(file: File): Promise<{ success: boolean; message: string; imported: number }> {
  try {
    const text = await file.text();
    const data: ExportData = JSON.parse(text);

    if (!data.version || !data.concepts) {
      throw new Error("Invalid export file format");
    }

    let imported = 0;

    for (const concept of data.concepts) {
      try {
        const res = await fetch("/api/concepts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            term: concept.term,
            definition: concept.definition,
            category: concept.category,
            difficulty: concept.difficulty,
            relatedConcepts: concept.relatedConcepts,
          }),
          credentials: "include",
        });

        if (res.ok) {
          imported++;
        }
      } catch (err) {
        console.error("Failed to import concept:", concept.term, err);
      }
    }

    return {
      success: true,
      message: `Successfully imported ${imported} concepts`,
      imported,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to import data",
      imported: 0,
    };
  }
}

export function validateImportFile(file: File): { valid: boolean; error?: string } {
  if (!file.name.endsWith(".json")) {
    return { valid: false, error: "Please upload a JSON file" };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: "File size must be less than 10MB" };
  }

  return { valid: true };
}
