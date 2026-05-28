import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, ExternalLink, Play, Square, Image as ImageIcon, Box, Headphones, Volume2, ArrowRight, Loader2, Network } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Concepts() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: allConcepts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/concepts"],
    initialData: [],
    refetchOnMount: true,
  });

  // STRICT FILTERING: Only show concepts from the absolute latest scan session
  const latestConcepts = (() => {
    if (!allConcepts || allConcepts.length === 0) return [];
    
    // 1. Find the latest valid timestamp across all concepts
    const timestamps = allConcepts
      .map(c => c.createdAt ? new Date(c.createdAt).getTime() : 0)
      .filter(t => t > 0);
      
    if (timestamps.length === 0) return allConcepts;
    
    const latestTime = Math.max(...timestamps);
    
    // 2. Return concepts from the same "session" (within 60 seconds of latest)
    const filtered = allConcepts.filter(c => {
      if (!c.createdAt) return false;
      const time = new Date(c.createdAt).getTime();
      return Math.abs(time - latestTime) < 60000;
    });

    return filtered;
  })();

  const [selectedConcept, setSelectedConcept] = useState<any>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Auto-select latest concept
  useEffect(() => {
    if (latestConcepts && latestConcepts.length > 0 && !selectedConcept) {
      setSelectedConcept(latestConcepts[0]);
    }
  }, [latestConcepts, selectedConcept]);

  const playAudio = () => {
    if (isAudioPlaying) {
      window.speechSynthesis.cancel();
      setIsAudioPlaying(false);
      return;
    }
    
    if (!selectedConcept) return;
    const utterance = new SpeechSynthesisUtterance(selectedConcept.definition);
    utterance.onend = () => setIsAudioPlaying(false);
    setIsAudioPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const filteredConcepts = (latestConcepts || []).filter((concept: any) =>
    concept.term.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-48 mb-4" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
          <Skeleton className="lg:col-span-2 h-96" />
        </div>
      </div>
    );
  }

  if (!latestConcepts || latestConcepts.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
          <BookOpen className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-display font-bold mb-3">No Concepts Found</h1>
        <p className="text-muted-foreground max-w-sm mb-8">Scan a page to generate your first 5 logical concepts.</p>
        <Button onClick={() => setLocation("/scan")}>Go to Scan</Button>
      </div>
    );
  }

  const userPreference = user?.learningStyle || "visual";
  
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">My Concepts</h1>
          <p className="text-muted-foreground">Displaying latest generated concepts from your scan</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sidebar Navigation - Strictly Latest 5 */}
        <div className="lg:col-span-1 space-y-3 max-h-[75vh] overflow-y-auto pr-2">
          {filteredConcepts.map((concept: any) => (
            <div
              key={concept.id}
              className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 flex items-center justify-between group ${
                selectedConcept?.id === concept.id 
                  ? "border-primary bg-primary/5 shadow-md translate-x-1" 
                  : "border-transparent bg-card hover:bg-muted/50"
              }`}
              onClick={() => setSelectedConcept(concept)}
            >
              <div className="min-w-0">
                <h3 className="font-bold text-base truncate">{concept.term}</h3>

              </div>
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center border ${
                selectedConcept?.id === concept.id ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50"
              }`}>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Detail View - No Filler Text */}
        <div className="lg:col-span-2">
          {selectedConcept && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="overflow-hidden border-none shadow-2xl bg-card rounded-3xl">
                <CardHeader className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs uppercase font-bold">
                      {selectedConcept.category}
                    </Badge>
                    <Badge variant="outline">{selectedConcept.difficulty}</Badge>
                  </div>
                  <CardTitle className="text-5xl font-display font-black tracking-tighter mb-4">
                    {selectedConcept.term}
                  </CardTitle>
                  <div className="p-6 rounded-2xl bg-muted/30 border">
                    <p className="text-lg leading-relaxed">{selectedConcept.definition}</p>
                  </div>
                </CardHeader>
                
                <CardContent className="p-8 pt-0">
                  <Tabs defaultValue={userPreference} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8 h-14 bg-muted p-1.5 rounded-2xl">
                      <TabsTrigger value="visual" className="rounded-xl font-bold">Visual</TabsTrigger>
                      <TabsTrigger value="auditory" className="rounded-xl font-bold">Auditory</TabsTrigger>
                      <TabsTrigger value="kinesthetic" className="rounded-xl font-bold">AR Hub</TabsTrigger>
                    </TabsList>

                    <TabsContent value="visual" className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <Button 
                          variant="outline" 
                          className="h-24 rounded-2xl flex flex-col gap-2"
                          onClick={() => window.open(selectedConcept.multimediaResources?.googleImages || `https://www.google.com/search?tbm=isch&q=${selectedConcept.term}`, "_blank")}
                        >
                          <ImageIcon className="h-6 w-6 text-primary" />
                          <span>Google Diagrams</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-24 rounded-2xl flex flex-col gap-2"
                          onClick={() => window.open(selectedConcept.multimediaResources?.youtube || `https://www.youtube.com/results?search_query=${selectedConcept.term}`, "_blank")}
                        >
                          <Play className="h-6 w-6 text-red-500" />
                          <span>YouTube Explainer</span>
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="auditory" className="flex flex-col items-center py-10">
                      <Button 
                        size="lg"
                        className="px-10 py-8 rounded-3xl text-xl font-bold shadow-xl"
                        onClick={playAudio}
                      >
                        {isAudioPlaying ? <Square className="mr-3 h-6 w-6 fill-current" /> : <Play className="mr-3 h-6 w-6 fill-current" />}
                        {isAudioPlaying ? "Stop Audio" : "Listen to Definition"}
                      </Button>
                    </TabsContent>

                    <TabsContent value="kinesthetic">
                      <Card className="bg-primary text-primary-foreground p-10 rounded-[2.5rem]">
                        <h3 className="text-3xl font-black mb-4">3D AR Visualizer</h3>
                        <p className="mb-8 opacity-90">{selectedConcept.term}</p>
                        <Button 
                          variant="secondary" 
                          size="lg" 
                          className="font-black px-10 rounded-2xl shadow-2xl"
                          onClick={() => setLocation(`/ar-viewer?conceptId=${selectedConcept.id}`)}
                        >
                          Launch Experience <ArrowRight className="ml-3 h-6 w-6" />
                        </Button>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {selectedConcept.relatedConcepts && selectedConcept.relatedConcepts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Network className="h-5 w-5 text-primary" /> Related Concepts
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {selectedConcept.relatedConcepts.map((rel: string, i: number) => (
                      <Card 
                        key={i} 
                        className="p-4 hover:border-primary cursor-pointer rounded-2xl" 
                        onClick={() => {
                          const found = latestConcepts.find(c => c.term.toLowerCase() === rel.toLowerCase());
                          if (found) setSelectedConcept(found);
                        }}
                      >
                        <span className="font-bold text-xs truncate uppercase">{rel}</span>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
