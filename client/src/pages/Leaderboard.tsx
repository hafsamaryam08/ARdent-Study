import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Crown, Star, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface LeaderboardEntry {
  rank: number;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  score: number;
  conceptsLearned: number;
  quizzesCompleted: number;
  streak: number;
}

export default function Leaderboard() {
  const [, setLocation] = useLocation();
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: leaderboardData = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/leaderboard"],
  });

  const userScore = (stats?.conceptsLearned || 0) * 50 + (stats?.quizzesCompleted || 0) * 30 + (stats?.currentStreak || 0) * 10;
  
  const currentUserEntry = leaderboardData.find((e: any) => e.username === user?.username);
  const userRank = currentUserEntry?.rank || (leaderboardData.filter((e: any) => e.score > userScore).length + 1);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (rank === 2) return "bg-gray-100 text-gray-800 border-gray-300";
    if (rank === 3) return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">
          See how you rank among other learners
        </p>
      </div>

      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 ring-2 ring-primary ring-offset-2">
                  <AvatarImage src={user?.avatarUrl} />
                  <AvatarFallback className="text-lg">
                    {(user?.fullName || user?.username || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                  <Star className="h-3 w-3" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{user?.fullName || user?.username || "You"}</h3>
                <p className="text-sm text-muted-foreground">Your current ranking</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">#{userRank}</div>
              <div className="text-sm text-muted-foreground">{userScore} points</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Learners
          </CardTitle>
          <CardDescription>Weekly leaderboard rankings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : leaderboardData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No learners on the leaderboard yet.</p>
            ) : (
              leaderboardData.slice(0, 10).map((entry: any) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${getRankBadge(entry.rank)}`}
                >
                  <div className="flex items-center justify-center w-10 h-10">
                    {getRankIcon(entry.rank)}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={entry.avatarUrl} />
                    <AvatarFallback>
                      {(entry.fullName || entry.username || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{entry.fullName || entry.username}</div>
                    <div className="text-xs text-muted-foreground">@{entry.username}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-bold">{entry.score} pts</div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {entry.conceptsLearned} concepts
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {entry.streak} day streak
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">How Points Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>+50 points per concept learned</p>
            <p>+30 points per quiz completed</p>
            <p>+10 points per day streak</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Concepts</span>
              <span className="font-medium">{stats?.conceptsLearned || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quizzes</span>
              <span className="font-medium">{stats?.quizzesCompleted || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Streak</span>
              <span className="font-medium">{stats?.currentStreak || 0} days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="gap-1 bg-primary/5">
                <Star className="h-3 w-3 text-primary" /> {stats?.scannedPages > 0 ? "First Scan" : "Started"}
              </Badge>
              <Badge variant="outline" className="gap-1 bg-chart-2/5">
                <Award className="h-3 w-3 text-chart-2" /> {stats?.quizzesCompleted > 0 ? "Quizzer" : "Beginner"}
              </Badge>
              <Badge variant="outline" className="gap-1 bg-chart-4/5">
                <Trophy className="h-3 w-3 text-chart-4" /> {stats?.currentStreak || 0} Day Streak
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
