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
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreeDModel } from "@/components/ThreeDModel";
import { ARCameraView } from "@/components/ARCameraView";
import { ShareModal } from "@/components/ShareModal";

export default function ARViewer() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [showARCamera, setShowARCamera] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ["/api/ar/models"],
  });

  const { data: selectedModel, isLoading: modelDetailsLoading } = useQuery({
    queryKey: ["/api/ar/models", selectedModelId],
    enabled: !!selectedModelId,
  });

  // Set first model as default when models load
  useEffect(() => {
    if (models.length > 0 && !selectedModelId) {
      setSelectedModelId(models[0].id);
    }
  }, [models, selectedModelId]);

  const currentModel = selectedModel || (models.length > 0 ? models[0] : null);
  const currentModelId = selectedModelId || (models.length > 0 ? models[0]?.id : null);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  if (modelsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">AR Visualizer</h1>
          <p className="text-muted-foreground">Loading 3D models...</p>
        </div>
        <div className="grid lg:grid-cols-4 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="lg:col-span-3 h-96" />
        </div>
      </div>
    );
  }

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
        <p className="text-muted-foreground">Explore concepts in 3D augmented reality</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Model Selection */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Models ({models.length})</CardTitle>
              <CardDescription>Select a concept to visualize</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {models.map((model: any) => (
                <Button
                  key={model.id}
                  variant={currentModelId === model.id ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => setSelectedModelId(model.id)}
                  data-testid={`button-model-${model.id}`}
                >
                  <div className="truncate text-left">
                    <div className="font-medium text-sm">{model.title}</div>
                    <div className="text-xs opacity-70">{model.category}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {currentModel && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Model Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">{currentModel.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {currentModel.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {currentModel.category}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {currentModel.modelType}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* AR Viewer */}
        <div className="lg:col-span-3">
          {modelDetailsLoading ? (
            <Card>
              <CardContent className="p-12 flex items-center justify-center min-h-96">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading model...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className={isFullscreen ? "fixed inset-4 z-50" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{currentModel?.title} - 3D Model</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setShowInfo(!showInfo)}
                      data-testid="button-toggle-info"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      data-testid="button-toggle-fullscreen"
                    >
                      {isFullscreen ? (
                        <Minimize className="h-4 w-4" />
                      ) : (
                        <Maximize className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 3D Viewer with Three.js */}
                <div className="relative aspect-video bg-gradient-to-br from-primary/10 via-background to-secondary/10 rounded-lg overflow-hidden border border-border/50">
                  {currentModel && (
                    <ThreeDModel
                      modelType={currentModel.modelType || "generic-model"}
                      title={currentModel.title}
                      rotation={rotation}
                      zoom={zoom}
                    />
                  )}

                  {/* Overlay Info */}
                  {showInfo && currentModel && (
                    <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm p-4 rounded-lg max-w-xs border border-border/50 shadow-lg">
                      <h4 className="font-semibold text-sm mb-2">Details</h4>
                      <p className="text-xs text-muted-foreground line-clamp-4">{currentModel.description}</p>
                    </div>
                  )}

                  {/* Controls Overlay */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm rounded-full p-2 flex gap-1 border border-border/50 shadow-lg">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleZoomOut}
                      data-testid="button-zoom-out"
                      className="h-8 w-8"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleRotate}
                      data-testid="button-rotate"
                      className="h-8 w-8"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleZoomIn}
                      data-testid="button-zoom-in"
                      className="h-8 w-8"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <div className="w-px bg-border mx-1" />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      data-testid="button-share" 
                      className="h-8 w-8"
                      onClick={() => setShowShareModal(true)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      data-testid="button-ar-camera" 
                      className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => setShowARCamera(true)}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Components */}
                {selectedModel?.components && selectedModel.components.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-semibold">Key Components</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedModel.components.map((component: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-3 rounded-md border border-border/50 bg-muted/30"
                          data-testid={`component-${index}`}
                        >
                          <div
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: component.color }}
                          />
                          <span className="text-sm font-medium">{component.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Annotations */}
                {selectedModel?.annotations && selectedModel.annotations.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-semibold">Key Points</h4>
                    <div className="space-y-2">
                      {selectedModel.annotations.map((annotation: any) => (
                        <div key={annotation.id} className="p-3 bg-muted/50 rounded-md border border-border/50">
                          <p className="text-sm">{annotation.text}</p>
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
