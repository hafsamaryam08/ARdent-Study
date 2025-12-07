import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, CameraOff, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ARCameraViewProps {
  modelTitle: string;
  modelCategory: string;
  onClose: () => void;
}

export function ARCameraView({ modelTitle, modelCategory, onClose }: ARCameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
        setError(null);
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera access to use AR features.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Unable to access camera. Please try again.");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      Biology: "#22c55e",
      Chemistry: "#3b82f6",
      Physics: "#f59e0b",
      Mathematics: "#8b5cf6",
      "Computer Science": "#06b6d4",
      General: "#6b7280",
    };
    return colors[category] || colors.General;
  };

  const renderAROverlay = () => {
    const color = getCategoryColor(modelCategory);
    
    return (
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          transform: `scale(${zoom}) rotate(${rotation}deg)`,
          transition: "transform 0.3s ease",
        }}
      >
        <div className="relative">
          <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            className="drop-shadow-2xl"
          >
            <defs>
              <linearGradient id="arGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={color} stopOpacity="0.6" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            <g filter="url(#glow)">
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="url(#arGradient)"
                className="animate-pulse"
              />
              <circle
                cx="100"
                cy="100"
                r="60"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="10 5"
                className="animate-spin"
                style={{ animationDuration: "10s" }}
              />
              <polygon
                points="100,40 130,90 100,80 70,90"
                fill="white"
                opacity="0.8"
              />
              <polygon
                points="100,160 130,110 100,120 70,110"
                fill="white"
                opacity="0.8"
              />
            </g>
          </svg>
          
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap backdrop-blur-sm">
            {modelTitle}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="relative w-full h-full">
        {error ? (
          <div className="flex items-center justify-center h-full p-4">
            <Card className="max-w-md">
              <CardContent className="p-6">
                <Alert variant="destructive">
                  <CameraOff className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <div className="flex gap-2 mt-4">
                  <Button onClick={startCamera} variant="outline" className="flex-1">
                    Try Again
                  </Button>
                  <Button onClick={onClose} variant="default" className="flex-1">
                    Go Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {isStreaming && renderAROverlay()}

            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
              >
                Close AR
              </Button>
              
              <div className="bg-black/50 text-white px-3 py-1.5 rounded-full text-sm backdrop-blur-sm">
                {modelCategory}
              </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={handleZoomOut}
                className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm h-12 w-12 rounded-full"
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleRotate}
                className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm h-12 w-12 rounded-full"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleZoomIn}
                className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm h-12 w-12 rounded-full"
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
            </div>

            <div className="absolute bottom-4 left-4 text-white/70 text-xs bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
              {isStreaming ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  AR Active
                </span>
              ) : (
                "Initializing..."
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
