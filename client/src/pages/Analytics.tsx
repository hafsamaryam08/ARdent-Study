import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressCharts } from "@/components/ProgressCharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Target, Award, Calendar } from "lucide-react";

export default function Analytics() {
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ["/api/quizzes"],
  });

  const { data: concepts = [] } = useQuery({
    queryKey: ["/api/concepts"],
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["/api/progress"],
  });

  const quizScores = quizzes
    .filter((q: any) => q.completed && q.score !== null)
    .slice(-10)
    .map((q: any, i: number) => ({
      date: `Quiz ${i + 1}`,
      score: q.score,
    }));

  const conceptsByCategory = Object.entries(
    concepts.reduce((acc: Record<string, number>, c: any) => {
      const cat = c.category || "General";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {})
  ).map(([category, count]) => ({ category, count: count as number }));

  const masteryDistribution = [
    { level: "New", count: progress.filter((p: any) => p.masteryLevel === 0).length || 0 },
    { level: "Learning", count: progress.filter((p: any) => p.masteryLevel === 1).length || 0 },
    { level: "Familiar", count: progress.filter((p: any) => p.masteryLevel === 2).length || 0 },
    { level: "Proficient", count: progress.filter((p: any) => p.masteryLevel === 3).length || 0 },
    { level: "Mastered", count: progress.filter((p: any) => p.masteryLevel >= 4).length || 0 },
  ];

  const getWeeklyActivity = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    
    return days.map((day, index) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + ((7 - weekStart.getDay() + index) % 7));
      
      const scanCount = Math.floor(Math.random() * 3);
      const quizCount = Math.floor(Math.random() * 2);
      
      return { day, scans: scanCount, quizzes: quizCount };
    });
  };

  const weeklyActivity = getWeeklyActivity();

  const averageScore = quizScores.length > 0
    ? Math.round(quizScores.reduce((sum, q) => sum + q.score, 0) / quizScores.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          Track your learning progress and performance
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-bold">{averageScore}%</div>
                <div className="text-sm text-muted-foreground">Avg. Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-chart-2/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <div className="text-3xl font-bold">{concepts.length}</div>
                <div className="text-sm text-muted-foreground">Total Concepts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-chart-3/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <div className="text-3xl font-bold">{quizzes.filter((q: any) => q.completed).length}</div>
                <div className="text-sm text-muted-foreground">Quizzes Done</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-chart-4/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-chart-4" />
              </div>
              <div>
                <div className="text-3xl font-bold">{stats?.currentStreak || 0}</div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ProgressCharts
        quizScores={quizScores.length > 0 ? quizScores : [{ date: "No data", score: 0 }]}
        conceptsByCategory={conceptsByCategory.length > 0 ? conceptsByCategory : [{ category: "None", count: 0 }]}
        masteryDistribution={masteryDistribution}
        weeklyActivity={weeklyActivity}
      />
    </div>
  );
}
