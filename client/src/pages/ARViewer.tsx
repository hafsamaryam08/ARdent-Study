import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Maximize,
  Minimize,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Info,
  Share2,
  Loader2,
  Camera,
  Sparkles,
  Search,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ThreeDModel } from "@/components/ThreeDModel";
import { ARCameraView } from "@/components/ARCameraView";
import { ShareModal } from "@/components/ShareModal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { ARVisualizerCanvas } from "@/components/ARVisualizerCanvas";

// 1. DATA INTERFACE: Aligned with 'Concept' class in Project Report 
interface ARModel {
  id: string;
  title: string;
  category: string;
  description: string;
  modelType?: string;
  searchTerm?: string;
  modelUrl?: string;
  modelStatus?: "none" | "generating" | "completed" | "failed";
  components?: Array<{ name: string; color: string }>;
  annotations?: Array<{ id: string; text: string }>;
}

export default function ARViewer() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialConceptId = searchParams.get("conceptId");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(initialConceptId);
  const [showARCamera, setShowARCamera] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // 2. CONTROLLER LAYER: REST API Data Retrieval [cite: 363-371]
  const { data: allModels = [], isLoading: modelsLoading } = useQuery<any[]>({
    queryKey: ["/api/ar/models"],
  });


  // STRICT FILTERING: Only show models from the absolute latest scan session
  const models = (() => {
    if (!allModels || allModels.length === 0) return [];
    
    // 1. Filter out any concepts that don't have a timestamp (old legacy data)
    const validModels = allModels.filter(m => m.createdAt);
    if (validModels.length === 0) return [];

    // 2. Find the latest timestamp among valid models
    const timestamps = validModels.map(m => new Date(m.createdAt).getTime());
    const latestTime = Math.max(...timestamps);
    
    // 3. Return ONLY concepts that match this latest timestamp (within 5 seconds)
    const sessionModels = validModels.filter(m => {
      const time = new Date(m.createdAt).getTime();
      return Math.abs(time - latestTime) < 5000;
    });

    // 4. Final safety: If somehow we still have too many, just take the top 5
    return sessionModels.slice(0, 5);
  })();

  const filteredModels = models.filter(model => 
    model.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { data: selectedModel, isLoading: modelDetailsLoading } = useQuery<ARModel>({
    queryKey: ["/api/ar/models", selectedModelId],
    enabled: !!selectedModelId,
  });

  // Set first model as default when data is fetched
  useEffect(() => {
    if (models.length > 0 && !selectedModelId) {
      setSelectedModelId(models[0].id);
    }
  }, [models, selectedModelId]);

  // Priority mapping for UI rendering
  const currentModel = (selectedModel || models.find(m => m.id === selectedModelId) || (models.length > 0 ? models[0] : null)) as ARModel | null;

  // Polling for generation status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentModel?.modelStatus === "generating") {
      interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/ar/models"] });
        if (selectedModelId) {
          queryClient.invalidateQueries({ queryKey: ["/api/ar/models", selectedModelId] });
        }
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentModel?.modelStatus, selectedModelId]);

  const handleGenerateModel = async () => {
    if (!currentModel) return;
    try {
      await apiRequest("POST", `/api/ar/generate/${currentModel.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/ar/models"] });
      if (selectedModelId) {
        queryClient.invalidateQueries({ queryKey: ["/api/ar/models", selectedModelId] });
      }
      toast({
        title: "Generation Started",
        description: "AI is now reconstructing the 3D model. This may take 1-2 minutes.",
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  // Auto-trigger high-fidelity generation when a concept is viewed
  useEffect(() => {
    if (currentModel && currentModel.modelStatus === "none") {
      apiRequest("POST", `/api/ar/generate/${currentModel.id}`).catch(console.error);
    }
  }, [currentModel?.id, currentModel?.modelStatus]);

  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));

  if (modelsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-4" />
        <div className="grid lg:grid-cols-4 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="lg:col-span-3 h-96" />
        </div>
      </div>
    );
  }

  // 3. EXCEPTION HANDLING: Aligned with Feature 3.3 [cite: 262]
  if (models.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">AR Visualizer</h1>
          <p className="text-muted-foreground">Explore concepts in 3D augmented reality</p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No concepts available yet. Scan content to generate 3D models.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">AR Visualizer</h1>
        <p className="text-muted-foreground">Transforming static content into dynamic 3D visualizations [cite: 307]</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Model Selection List */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Available Models
                <Badge variant="outline">{models.length}</Badge>
              </CardTitle>
              <CardDescription>Select a concept to visualize </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search models..."
                  className="pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                {filteredModels.length > 0 ? (
                  filteredModels.map((model) => (
                    <Button
                      key={model.id}
                      variant={selectedModelId === model.id ? "default" : "outline"}
                      className="w-full justify-start text-left h-auto py-3 px-3 transition-all hover:translate-x-1"
                      onClick={() => setSelectedModelId(model.id)}
                    >
                      <div className="truncate text-left">
                        <div className="font-medium text-sm">{model.title}</div>

                      </div>
                    </Button>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm italic">
                    No matching models found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {currentModel && (
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" /> Model Intel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-bold">{currentModel.title}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{currentModel.category}</p>
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed">{currentModel.description}</p>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  {currentModel.modelUrl ? (
                    <Badge variant="default" className="bg-green-500 text-[10px]">AI Mesh Ready</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">Procedural Mesh</Badge>
                  )}
                  {currentModel.annotations && currentModel.annotations.length > 0 && (
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 border-purple-200 text-[10px]">AI Blueprints Active</Badge>
                  )}
                </div>

                <div className="space-y-2 pt-4">
                  {/* Main 3D Generation Button */}
                  <Button 
                    className={`w-full text-xs font-bold gap-2 ${
                      currentModel.modelStatus === "generating" ? "opacity-50 pointer-events-none" : "bg-gradient-to-r from-primary to-purple-600 hover:shadow-primary/20"
                    }`}
                    onClick={handleGenerateModel}
                  >
                    {currentModel.modelStatus === "generating" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {currentModel.modelUrl ? "Re-Generate 3D Model" : "Generate AI 3D Model"}
                  </Button>

                  {/* Manual Blueprint Trigger */}
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full text-[10px] font-semibold h-8"
                    onClick={async () => {
                      try {
                        await apiRequest("POST", `/api/ar/blueprint/${currentModel.id}`);
                        queryClient.invalidateQueries({ queryKey: ["/api/ar/models"] });
                        toast({ title: "NVIDIA Nemotron Active", description: "Updating AR labels using multimodal vision..." });
                      } catch (e: any) {
                        toast({ title: "NVIDIA Link Failed", description: e.message, variant: "destructive" });
                      }
                    }}
                  >
                    <Maximize className="h-3 w-3 mr-1" /> Refresh AI Blueprints
                  </Button>
                </div>
                
                {currentModel.modelStatus === "generating" && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-primary">
                      <Loader2 className="h-3 w-3 animate-spin" /> RUNNING HUGGINGFACE PIPELINE...
                    </div>
                    <Progress value={65} className="h-1.5" />
                    <p className="text-[9px] text-muted-foreground italic">Stage: StabilityAI SDXL to TripoSR Mesh</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 4. PRESENTATION LAYER: 3D Display [cite: 319, 358] */}
        <div className="lg:col-span-3">
          {modelDetailsLoading ? (
            <Card>
              <CardContent className="p-12 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-sm text-muted-foreground">AI is fetching the 3D asset...</p>
              </CardContent>
            </Card>
          ) : (
            <Card className={isFullscreen ? "fixed inset-4 z-50 shadow-2xl" : "relative"}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{currentModel?.title} - Interactive View</CardTitle>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => setShowInfo(!showInfo)}><Info className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setIsFullscreen(!isFullscreen)}>
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border border-border/50">
                  {/* AUTO-UPGRADING 3D ENGINE */}
                  {currentModel && (
                    <div className="w-full h-full">
                      <ARVisualizerCanvas 
                        title={currentModel.title}
                        proceduralData={(currentModel as any).proceduralData || []}
                        modelUrl={currentModel.modelUrl}
                      />
                    </div>
                  )}

                  {/* Silent Background Upgrading Indicator */}
                  {currentModel && currentModel.modelStatus === "generating" && (
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/30">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      <span className="text-[8px] font-black text-white uppercase tracking-widest">AI Mesh Baking...</span>
                    </div>
                  )}

                  {showInfo && currentModel && (
                    <div className="absolute top-4 right-4 space-y-2 max-w-xs">
                      <div className="bg-background/95 p-4 rounded-lg border shadow-lg text-xs">
                        <h4 className="font-semibold mb-1 flex items-center gap-2">
                          <Sparkles className="h-3 w-3 text-primary" /> AI Context
                        </h4>
                        <p className="text-muted-foreground">{currentModel.description}</p>
                      </div>
                      
                      {currentModel.annotations && currentModel.annotations.length > 0 && (
                        <div className="bg-primary/90 text-primary-foreground p-3 rounded-lg shadow-xl animate-in slide-in-from-right duration-500">
                          <h4 className="text-[10px] uppercase font-bold tracking-widest mb-2 opacity-80">Interactive Labels</h4>
                          <div className="space-y-1.5">
                            {currentModel.annotations.map((ann: any) => (
                              <div key={ann.id} className="flex items-center gap-2 text-[11px] font-medium">
                                <div className="h-1 w-1 rounded-full bg-white" />
                                {typeof ann.text === "string" ? ann.text : (ann.text?.label || ann.text?.trigger || "Interactive Label")}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* INTERACTIVE CONTROLS: Supporting Feature 3.2 [cite: 260] */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/95 rounded-full p-2 flex gap-1 shadow-lg border">
                    <Button size="icon" variant="ghost" onClick={handleZoomOut} className="h-8 w-8"><ZoomOut className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={handleRotate} className="h-8 w-8"><RotateCw className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={handleZoomIn} className="h-8 w-8"><ZoomIn className="h-4 w-4" /></Button>
                    <div className="w-px bg-border mx-1" />
                    <Button size="icon" variant="ghost" onClick={() => setShowShareModal(true)} className="h-8 w-8"><Share2 className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setShowARCamera(true)} className="h-8 w-8 bg-primary text-white hover:bg-primary/90"><Camera className="h-4 w-4" /></Button>
                  </div>
                </div>

                {/* 5. KEY COMPONENTS: Fetched from Database [cite: 417] */}
                {currentModel?.components && currentModel.components.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-semibold">Major Structures </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {currentModel.components.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 rounded-md border bg-muted/20">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="text-sm font-medium">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showARCamera && currentModel && (
        <ARCameraView
          modelTitle={currentModel.title}
          modelCategory={currentModel.category}
          onClose={() => setShowARCamera(false)}
        />
      )}

      {currentModel && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={currentModel.title}
          description={currentModel.description || ""}
          shareType="concept"
        />
      )}
    </div>
  );
}