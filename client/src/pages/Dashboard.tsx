import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, BookOpen, Trophy, TrendingUp, Calendar, Clock, ArrowRight, Sparkles, Upload, Zap, Brain, Target, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { AITutorWidget } from "@/components/AITutorWidget";

interface DashboardStats {
  scannedPages: number;
  conceptsLearned: number;
  quizzesCompleted: number;
  currentStreak: number;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: progress } = useQuery<any[]>({
    queryKey: ["/api/progress"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: quizzes = [] } = useQuery<any[]>({
    queryKey: ["/api/quizzes"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: concepts = [] } = useQuery<any[]>({
    queryKey: ["/api/concepts"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const recentActivity = [...quizzes.map(q => ({
    id: `quiz-${q.id}`, type: "quiz", title: q.title || "Quiz", score: q.score, time: new Date(q.createdAt).toLocaleString(), timestamp: new Date(q.createdAt).getTime()
  })), ...concepts.map(c => ({
    id: `concept-${c.id}`, type: "concept", title: c.term || "Concept", score: undefined, time: new Date(c.createdAt).toLocaleString(), timestamp: new Date(c.createdAt).getTime()
  }))].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

  // Recommendations logic
  const recommendations = [];
  if (stats && stats.scannedPages === 0) {
    recommendations.push({
      id: "scan",
      title: "Start Your Journey",
      desc: "Upload your first document to see AR magic.",
      icon: Upload,
      action: () => setLocation("/scan"),
      color: "text-primary",
      bg: "bg-primary/10"
    });
  } else if (concepts.length > 0) {
    recommendations.push({
      id: "ar",
      title: "Visualize Knowledge",
      desc: `Explore 3D models for ${concepts[0].term}.`,
      icon: Brain,
      action: () => setLocation("/ar-viewer"),
      color: "text-chart-2",
      bg: "bg-chart-2/10"
    });
  }

  if (quizzes.length === 0 && concepts.length > 0) {
    recommendations.push({
      id: "quiz",
      title: "Test Your Mastery",
      desc: "Take a quick quiz on your latest concepts.",
      icon: Trophy,
      action: () => setLocation("/quizzes"),
      color: "text-chart-3",
      bg: "bg-chart-3/10"
    });
  }

  // Fallback recommendation
  if (recommendations.length < 3) {
    recommendations.push({
      id: "graph",
      title: "Knowledge Map",
      desc: "See how your learned concepts connect.",
      icon: Target,
      action: () => setLocation("/knowledge-graph"),
      color: "text-chart-4",
      bg: "bg-chart-4/10"
    });
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-8 border border-primary/10">
        <div className="relative z-10">
          <h1 className="text-4xl font-display font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Welcome Back, {user?.fullName || user?.username || 'Learner'}! ✨
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            You're doing great! You've mastered {stats?.conceptsLearned || 0} concepts so far. Keep the momentum going!
          </p>
        </div>
        <Sparkles className="absolute right-8 top-1/2 -translate-y-1/2 h-32 w-32 text-primary/5 -rotate-12" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 bg-card/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Camera className="h-7 w-7 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-bold tracking-tight" data-testid="stat-scanned-pages">
                  {stats?.scannedPages || 0}
                </div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pages Scanned</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:border-chart-2/50 transition-all duration-300 hover:shadow-xl hover:shadow-chart-2/10 bg-card/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-2/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-chart-2/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-7 w-7 text-chart-2" />
              </div>
              <div>
                <div className="text-3xl font-bold tracking-tight" data-testid="stat-concepts-learned">
                  {stats?.conceptsLearned || 0}
                </div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Concepts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:border-chart-3/50 transition-all duration-300 hover:shadow-xl hover:shadow-chart-3/10 bg-card/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-3/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-chart-3/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Trophy className="h-7 w-7 text-chart-3" />
              </div>
              <div>
                <div className="text-3xl font-bold tracking-tight" data-testid="stat-quizzes-completed">
                  {stats?.quizzesCompleted || 0}
                </div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Quizzes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:border-chart-1/50 transition-all duration-300 hover:shadow-xl hover:shadow-chart-1/10 bg-card/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-1/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-chart-1/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-7 w-7 text-chart-1" />
              </div>
              <div>
                <div className="text-3xl font-bold tracking-tight" data-testid="stat-current-streak">
                  {stats?.currentStreak || 0}
                </div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Day Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Activity Feed */}
        <Card className="lg:col-span-3 border-none bg-card/50 backdrop-blur-md shadow-2xl shadow-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              <Clock className="h-6 w-6 text-primary" />
              Recent Learning
            </CardTitle>
            <CardDescription>Your latest achievements and scans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivity.length > 0 ? recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-4 group">
                  <div className="mt-1">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-md">
                      <AvatarImage src={user?.avatarUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold uppercase">
                        {user?.username?.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-bold">
                      {activity.type === "quiz" ? "Completed " : "Scanned "}
                      <span className="text-primary group-hover:underline cursor-pointer">{activity.title}</span>
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {activity.time}
                    </p>
                    {activity.score !== undefined && (
                      <div className="mt-4 bg-muted/30 p-3 rounded-xl">
                        <div className="flex justify-between text-xs font-bold mb-2">
                          <span>QUIZ PERFORMANCE</span>
                          <span className={activity.score >= 80 ? 'text-green-500' : 'text-primary'}>{activity.score}%</span>
                        </div>
                        <Progress value={activity.score} className="h-2 bg-muted shadow-inner" />
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-12 bg-card rounded-3xl border border-dashed border-border/50">
                  <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">No recent activity found yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations - REPLACED Upcoming Reviews */}
        <Card className="lg:col-span-2 border-primary/10 bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-md self-start overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Study Assistant
            </CardTitle>
            <CardDescription>Tailored path for your {user?.learningStyle || 'visual'} style</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-primary/5">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-5 hover:bg-white/40 transition-colors cursor-pointer group"
                  onClick={rec.action}
                >
                  <div className="flex gap-4">
                    <div className={`h-12 w-12 rounded-2xl ${rec.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      <rec.icon className={`h-6 w-6 ${rec.color}`} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm flex items-center gap-2">
                        {rec.title}
                        <Zap className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {rec.desc}
                      </p>
                      <div className="pt-2 flex items-center text-[10px] font-bold text-primary tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                        Go Now <ArrowRight className="ml-1 h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-primary/5 border-t border-primary/10">
              <Button
                variant="ghost"
                className="w-full text-xs font-bold gap-2 text-primary hover:bg-primary/10"
                onClick={() => setLocation("/concepts")}
              >
                <Sparkles className="h-3 w-3" /> View Personalized Hub
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Enhanced */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-24 flex-col gap-2 rounded-2xl border-primary/10 hover:border-primary/40 hover:bg-primary/5 transition-all"
          onClick={() => setLocation("/scan")}
          data-testid="button-quick-scan"
        >
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-xs">Upload Doc</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col gap-2 rounded-2xl border-chart-2/10 hover:border-chart-2/40 hover:bg-chart-2/5 transition-all"
          onClick={() => setLocation("/ar-viewer")}
          data-testid="button-quick-ar"
        >
          <div className="h-10 w-10 rounded-xl bg-chart-2/10 flex items-center justify-center">
            <Brain className="h-5 w-5 text-chart-2" />
          </div>
          <span className="font-bold text-xs">Launch AR</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col gap-2 rounded-2xl border-chart-3/10 hover:border-chart-3/40 hover:bg-chart-3/5 transition-all"
          onClick={() => setLocation("/quizzes")}
          data-testid="button-quick-quiz"
        >
          <div className="h-10 w-10 rounded-xl bg-chart-3/10 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-chart-3" />
          </div>
          <span className="font-bold text-xs">Start Quiz</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col gap-2 rounded-2xl border-chart-4/10 hover:border-chart-4/40 hover:bg-chart-4/5 transition-all"
          onClick={() => setLocation("/knowledge-graph")}
          data-testid="button-quick-graph"
        >
          <div className="h-10 w-10 rounded-xl bg-chart-4/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-chart-4" />
          </div>
          <span className="font-bold text-xs">View Graph</span>
        </Button>
      </div>
    </div>
  );
}
