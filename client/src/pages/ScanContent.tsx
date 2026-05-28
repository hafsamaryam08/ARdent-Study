import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Check, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Tesseract from "tesseract.js";

export default function ScanContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [scannedText, setScannedText] = useState("");
  const [extractedConcepts, setExtractedConcepts] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, text, concepts }: { file: File; text: string; concepts: string[] }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("extractedText", text);
      formData.append("concepts", JSON.stringify(concepts));

      const res = await fetch("/api/scan/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Upload failed");
      }

      return res.json();
    },
    onSuccess: (data) => {
      setScannedText(data.extractedText);
      setExtractedConcepts(data.concepts || []);
      setError("");
      setSuccess(true);
      
      toast({
        title: "Scan Successful",
        description: `Identified ${data.concepts?.length || 0} concepts. Review them below.`,
      });
    },
    onError: (err: any) => {
      const errorMsg = err.message || "Failed to process file";
      setError(errorMsg);
      setSuccess(false);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    },
  });

  // Concept extraction is now handled by AI on the backend

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError("");
    setSuccess(false);
    setIsExtracting(true);
    
    const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      const msg = "Please upload PNG, JPG, or PDF files only";
      setError(msg);
      setIsExtracting(false);
      toast({ title: "Invalid file type", description: msg, variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      const msg = "File size must be less than 10MB";
      setError(msg);
      setIsExtracting(false);
      toast({ title: "File too large", description: msg, variant: "destructive" });
      return;
    }

    try {
      toast({
        title: "Processing file...",
        description: file.type === "application/pdf" ? "Converting PDF to readable image..." : "Sharpening image for OCR...",
      });

      let canvas = document.createElement("canvas");

      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: ctx, viewport } as any).promise;
        }
      } else {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        // We no longer need slow pixel-level binarization on the client!
        // Gemini Vision handles color/contrast much better than manual JS loops.
        URL.revokeObjectURL(img.src);
      }

      // Concept extraction is now handled by Gemini Vision on the backend!
      setIsExtracting(false);
      uploadMutation.mutate({ file, text: "", concepts: [] });
    } catch (err: any) {
      setIsExtracting(false);
      const errorMsg = err.message || "Failed to process file";
      setError(errorMsg);
      toast({ title: "Processing failed", description: errorMsg, variant: "destructive" });
    }
  };

  const createConceptsMutation = useMutation({
    mutationFn: async (concepts: string[]) => {
      const res = await fetch("/api/concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concepts }),
        credentials: "include", 
      });
      
      if (!res.ok) {
        throw new Error("Server error: Concept could not be saved.");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/concepts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-graph"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ar/models"] });

      toast({ 
        title: "Success", 
        description: "Concepts saved! Your library and dashboard have been updated." 
      });
      
      setScannedText("");
      setExtractedConcepts([]);
      setSuccess(false);
      setLocation("/concepts"); 
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to create concepts",
        variant: "destructive",
      });
    },
  });

  const handleConfirm = () => {
    if (extractedConcepts?.length > 0) {
      createConceptsMutation.mutate(extractedConcepts);
    } else {
      toast({
        title: "No concepts selected",
        description: "Please ensure the scan found at least one concept to enhance.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">Scan Content</h1>
        <p className="text-muted-foreground">
          Upload textbook images or PDFs to extract key concepts instantly
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && scannedText && (
        <Alert className="border-green-600/50 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Document scanned successfully! Review the extracted content below.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-primary/20 shadow-sm overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload File
          </CardTitle>
          <CardDescription>
            Upload an image or PDF of your textbook or notes for AI processing
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <div 
            className="border-2 border-dashed border-primary/20 rounded-xl p-16 text-center hover:bg-primary/5 transition-all cursor-pointer group"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Upload className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Drop your file here</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Supports JPG, PNG, and PDF documents up to 10MB in size
            </p>
            <Button variant="default" className="shadow-lg shadow-primary/20" disabled={uploadMutation.isPending || isExtracting}>
              {uploadMutation.isPending || isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Select File"
              )}
            </Button>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              data-testid="input-file-upload"
              disabled={uploadMutation.isPending || isExtracting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Extracted Content */}
      {scannedText && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Content</CardTitle>
            <CardDescription>Review and confirm the extracted text and concepts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Extracted Content</h3>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Full Text:</p>
                  <p className="text-sm leading-relaxed" data-testid="text-extracted-content">
                    {scannedText}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Identified Concepts</h3>
              <div className="flex flex-wrap gap-2">
                {(extractedConcepts || []).map((concept, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-sm px-3 py-1"
                    data-testid={`badge-concept-${index}`}
                  >
                    {concept}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleConfirm}
                className="flex-1"
                data-testid="button-confirm-scan"
                disabled={createConceptsMutation.isPending}
              >
                {createConceptsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving Concepts...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirm & Enhance Concepts
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setScannedText("");
                  setExtractedConcepts([]);
                  setError("");
                }}
                data-testid="button-rescan"
              >
                Rescan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
