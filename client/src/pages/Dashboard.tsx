import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, BookOpen, Trophy, TrendingUp, Calendar, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn, queryClient } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import avatar1 from "@assets/generated_images/Student_profile_avatar_1_29cf34d7.png";

interface DashboardStats {
  scannedPages: number;
  conceptsLearned: number;
  quizzesCompleted: number;
  currentStreak: number;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: progress } = useQuery<any[]>({
    queryKey: ["/api/progress"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const mockRecentActivity = [
    { id: 1, type: "scan", title: "Recent Scan", time: "2 hours ago", score: undefined },
    { id: 2, type: "quiz", title: "Latest Quiz", score: 85, time: "5 hours ago" },
    { id: 3, type: "concept", title: "Studied Topic", time: "1 day ago", score: undefined },
  ];

  const upcomingReviews = (progress || [])
    .filter((p: any) => p.nextReview)
    .sort((a: any, b: any) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime())
    .slice(0, 3)
    .map((p: any, i: number) => ({
      id: i + 1,
      concept: p.conceptId,
      dueIn: "Soon",
    }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">Welcome Back!</h1>
        <p className="text-muted-foreground">Here's your learning progress overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-bold" data-testid="stat-scanned-pages">
                  {stats?.scannedPages || 0}
                </div>
                <div className="text-sm text-muted-foreground">Pages Scanned</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-chart-2/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <div className="text-3xl font-bold" data-testid="stat-concepts-learned">
                  {stats?.conceptsLearned || 0}
                </div>
                <div className="text-sm text-muted-foreground">Concepts Learned</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-chart-3/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <div className="text-3xl font-bold" data-testid="stat-quizzes-completed">
                  {stats?.quizzesCompleted || 0}
                </div>
                <div className="text-sm text-muted-foreground">Quizzes Done</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-chart-4/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-chart-4" />
              </div>
              <div>
                <div className="text-3xl font-bold" data-testid="stat-streak">
                  {stats?.currentStreak || 0}
                </div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest learning actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-lg hover-elevate"
                  data-testid={`activity-${activity.id}`}
                >
                  <Avatar>
                    <AvatarImage src={avatar1} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
                    {activity.score !== undefined && (
                      <div className="mt-2">
                        <Progress value={activity.score} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">Score: {activity.score}%</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Reviews
            </CardTitle>
            <CardDescription>Spaced repetition schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingReviews.length > 0 ? (
                <>
                  {upcomingReviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                      data-testid={`review-${review.id}`}
                    >
                      <div>
                        <p className="font-medium">{review.concept}</p>
                        <p className="text-sm text-muted-foreground">Due {review.dueIn}</p>
                      </div>
                      <Button size="sm" variant="outline">Review</Button>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No reviews due yet. Start scanning to get started!</p>
              )}
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setLocation("/scan")}
                data-testid="button-view-all-reviews"
              >
                Scan New Content
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" onClick={() => setLocation("/scan")} data-testid="button-scan-new">
              <Camera className="h-4 w-4 mr-2" />
              Scan Page
            </Button>
            <Button variant="outline" onClick={() => setLocation("/concepts")} data-testid="button-view-concepts">
              <BookOpen className="h-4 w-4 mr-2" />
              Concepts
            </Button>
            <Button variant="outline" onClick={() => setLocation("/quizzes")} data-testid="button-take-quiz">
              <Trophy className="h-4 w-4 mr-2" />
              Quizzes
            </Button>
            <Button variant="outline" onClick={() => setLocation("/ar")} data-testid="button-view-ar">
              <TrendingUp className="h-4 w-4 mr-2" />
              AR View
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
