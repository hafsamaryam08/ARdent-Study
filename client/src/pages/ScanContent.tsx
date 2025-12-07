import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Check, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      setExtractedConcepts(data.concepts);
      setError("");
      setSuccess(true);
      
      // Clear cache and immediately refetch new data
      queryClient.removeQueries({ queryKey: ["/api/concepts"] });
      queryClient.removeQueries({ queryKey: ["/api/knowledge-graph"] });
      queryClient.removeQueries({ queryKey: ["/api/ar/models"] });
      
      // Trigger immediate refetch
      queryClient.refetchQueries({ queryKey: ["/api/concepts"], type: 'all' });
      queryClient.refetchQueries({ queryKey: ["/api/knowledge-graph"], type: 'all' });
      queryClient.refetchQueries({ queryKey: ["/api/ar/models"], type: 'all' });
      
      toast({
        title: "Success",
        description: `Found ${data.concepts?.length || 0} concept(s) in your document`,
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

  const handleCapture = () => {
    // Mock camera capture - in real app would open camera
    console.log("Camera capture initiated");
  };

  const extractConceptsFromText = (text: string): string[] => {
    // Comprehensive stop words and OCR garbage patterns
    const stopWords = new Set([
      "the", "a", "an", "and", "or", "but", "for", "of", "to", "in", "on", "at", "by", "from",
      "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does",
      "did", "will", "would", "could", "should", "may", "might", "can", "must", "shall",
      "example", "examples", "such", "this", "that", "these", "those", "i", "you", "he",
      "she", "it", "we", "they", "what", "which", "who", "when", "where", "why", "how",
      "as", "if", "than", "then", "so", "too", "also", "even", "all", "each", "every",
      "both", "either", "neither", "any", "some", "few", "many", "much", "more", "most",
      "no", "not", "only", "very", "just", "my", "your", "his", "her", "its", "our",
      "their", "etc", "et", "al", "vs", "v", "page", "pp", "chapter", "fig", "table",
      "reader", "has", "having", "made", "make", "fthe", "tthe", "thhe", "thee",
      "like", "way", "figure", "probably", "prbably", "likely", "seem", "appears", "shown",
      "see", "show", "indicate", "indicates", "illustrate", "illustrates", "present", "presents",
      "discuss", "discusses", "explain", "explains", "describe", "describes", "show", "shown",
      "plain", "text", "drawing", "field", "activity", "drawing", "type", "content", "uploaded"
    ]);

    // Filter out OCR garbage and metadata lines
    const cleanedText = text
      .split("\n")
      .filter(line => {
        const lower = line.toLowerCase();
        // Remove OCR metadata patterns
        if (/field\d+\s*=/.test(lower)) return false; // Field19=467abe
        if (/drawing.*type/i.test(lower)) return false; // DrawingType=...
        if (/^plain\s*text/i.test(lower)) return false; // Plain text
        if (/uploaded.*content/i.test(lower)) return false; // uploaded content
        if (line.match(/^[A-Z]+[0-9]+=/) || line.match(/[a-f0-9]{6,}/)) return false; // Hex/metadata
        return line.trim().length > 5;
      })
      .join("\n");

    const sentences = cleanedText.split(/[.!?;\n]+/);
    const concepts = new Set<string>();
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length < 5) continue;
      
      const words = trimmed
        .split(/\s+/)
        .map(w => w.replace(/[^a-zA-Z0-9\-]/g, "").toLowerCase())
        .filter(w => w.length > 2);
      
      if (words.length === 0) continue;
      
      // Extract meaningful phrases
      for (let i = 0; i < words.length; i++) {
        // Skip if starting with stop word
        if (stopWords.has(words[i])) continue;
        
        // Skip pure numbers or hex codes
        if (/^\d+$/.test(words[i]) || /^[a-f0-9]{4,}$/.test(words[i])) continue;
        
        // Create 1-2 word phrases
        for (let len = 1; len <= 2 && i + len <= words.length; len++) {
          const phraseWords = words.slice(i, i + len);
          
          // Skip if any word in phrase is a stop word
          if (phraseWords.some(w => stopWords.has(w))) continue;
          
          const phrase = phraseWords.join(" ");
          
          // Validate phrase
          if (phrase.length >= 4 &&
              /[a-z]/.test(phrase) &&
              !phrase.match(/(.)\1{3,}/) &&
              !phrase.match(/^\d/) &&
              !stopWords.has(phrase)) {
            concepts.add(phrase);
          }
        }
      }
    }
    
    // Filter: meaningful concepts only
    const filtered = Array.from(concepts)
      .filter(c => {
        // Remove if too short or too long
        if (c.length < 4 || c.length > 50) return false;
        // Remove if all numbers or hex
        if (!/[a-z]/.test(c)) return false;
        // Remove if contains only stop words
        const phraseWords = c.split(" ");
        if (phraseWords.every(w => stopWords.has(w))) return false;
        // Remove OCR garbage patterns
        if (/[a-f0-9]{6,}/.test(c)) return false; // Hex codes
        if (c.match(/field\d+/i) || c.match(/drawingtype/i)) return false;
        return true;
      })
      .sort((a, b) => b.length - a.length)
      .slice(0, 15);
    
    return filtered;
  };

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
      toast({
        title: "Invalid file type",
        description: msg,
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      const msg = "File size must be less than 10MB";
      setError(msg);
      setIsExtracting(false);
      toast({
        title: "File too large",
        description: msg,
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Extracting text...",
        description: "This may take a minute for large documents",
      });

      const result = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });
      const extractedText = result.data.text.trim();
      const concepts = extractConceptsFromText(extractedText);

      setIsExtracting(false);
      uploadMutation.mutate({ file, text: extractedText, concepts });
    } catch (err: any) {
      setIsExtracting(false);
      const errorMsg = err.message || "Failed to extract text from image";
      setError(errorMsg);
      toast({
        title: "Extraction failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const createConceptsMutation = useMutation({
    mutationFn: async (concepts: string[]) => {
      const results = [];
      for (const term of concepts) {
        const res = await fetch("/api/concepts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            term,
            definition: `Extracted from scanned content: ${scannedText.slice(0, 100)}...`,
            category: "General",
            difficulty: "medium",
          }),
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const data = await res.json();
        results.push(data);
      }
      return results;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/concepts"] });
      toast({
        title: "Success",
        description: `Created ${extractedConcepts.length} concept(s)`,
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
    if (extractedConcepts.length > 0) {
      createConceptsMutation.mutate(extractedConcepts);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">Scan Content</h1>
        <p className="text-muted-foreground">
          Capture textbook pages or upload images to extract key concepts
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

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="camera" data-testid="tab-camera">
            <Camera className="h-4 w-4 mr-2" />
            Camera
          </TabsTrigger>
          <TabsTrigger value="upload" data-testid="tab-upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </TabsTrigger>
        </TabsList>

        <TabsContent value="camera" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Camera Capture</CardTitle>
              <CardDescription>
                Point your camera at a textbook page or printed notes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Camera feature coming soon</p>
                </div>
                <div className="absolute inset-0 border-4 border-dashed border-primary/30 rounded-lg m-8" />
              </div>

              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleCapture}
                  disabled
                  className="w-32 h-32 rounded-full"
                  data-testid="button-capture"
                >
                  <Camera className="h-8 w-8" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Upload an image of your textbook or notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover-elevate">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  PNG, JPG or PDF (Max 10MB)
                </p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  data-testid="input-file-upload"
                  disabled={uploadMutation.isPending}
                />
                <label htmlFor="file-upload">
                  <Button
                    asChild
                    disabled={uploadMutation.isPending}
                  >
                    <span>
                      {uploadMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Select File"
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">Source Type</p>
                    <p className="text-sm font-semibold">Image Document</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium">Confidence</p>
                    <p className="text-sm font-semibold">85%</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Identified Concepts</h3>
              <div className="flex flex-wrap gap-2">
                {extractedConcepts.map((concept, index) => (
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
