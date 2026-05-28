import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, ArrowRight, Network, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Recommendation {
  topic: string;
  reason: string;
}

interface AIRecommendations {
  recommendations: Recommendation[];
  graphInsight: string;
}

export function AITutorWidget() {
  const { data, isLoading, error } = useQuery<AIRecommendations>({
    queryKey: ["/api/ai-tutor/recommendations"],
  });

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-slate-900/50 backdrop-blur-md overflow-hidden min-h-[300px] flex flex-col justify-center items-center text-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm font-black text-white uppercase tracking-widest animate-pulse">Consulting your Learning Graph...</p>
        <p className="text-[10px] text-slate-400 mt-2">NVIDIA Nemotron is analyzing your knowledge connections</p>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-gradient-to-br from-slate-900 to-slate-950 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Network size={120} className="text-primary" />
        </div>
        
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-primary/20 p-1.5 rounded-lg">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/30 text-primary">AI Learning Assistant</Badge>
          </div>
          <CardTitle className="text-xl font-black text-white">ARdent Study Tutor</CardTitle>
          <CardDescription className="text-slate-400 text-xs italic">
            "Your Neo4j graph reveals a pattern in your recent studies."
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Graph Insight */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 rounded-xl bg-primary/5 border border-primary/10 relative group"
          >
            <div className="absolute -top-2 -left-2">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-tighter text-primary mb-1">Knowledge Connection</h4>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {data.graphInsight}
            </p>
          </motion.div>

          {/* Recommendations */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              Recommended Next Modules <ArrowRight className="h-3 w-3" />
            </h4>
            
            <div className="grid gap-3">
              {data.recommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
                    <CardContent className="p-3 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{rec.topic}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{rec.reason}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full border border-white/10 group-hover:bg-primary group-hover:text-white transition-all">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
