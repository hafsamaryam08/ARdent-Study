import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Crown, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const mockLeaderboard: LeaderboardEntry[] = [
    { rank: 1, username: "star_learner", fullName: "Alex Chen", score: 2450, conceptsLearned: 45, quizzesCompleted: 32, streak: 15 },
    { rank: 2, username: "knowledge_seeker", fullName: "Maya Patel", score: 2280, conceptsLearned: 42, quizzesCompleted: 28, streak: 12 },
    { rank: 3, username: "study_master", fullName: "Jordan Lee", score: 2100, conceptsLearned: 38, quizzesCompleted: 25, streak: 10 },
    { rank: 4, username: "brain_power", fullName: "Sam Wilson", score: 1950, conceptsLearned: 35, quizzesCompleted: 22, streak: 8 },
    { rank: 5, username: "curious_mind", fullName: "Taylor Brown", score: 1820, conceptsLearned: 32, quizzesCompleted: 20, streak: 7 },
  ];

  const userScore = (stats?.conceptsLearned || 0) * 50 + (stats?.quizzesCompleted || 0) * 30 + (stats?.currentStreak || 0) * 10;
  const userRank = mockLeaderboard.filter(e => e.score > userScore).length + 1;

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
                    {user?.fullName?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"}
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
            {mockLeaderboard.map((entry) => (
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
                    {entry.fullName?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
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
            ))}
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
            <p>Bonus points for high quiz scores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Concepts Learned</span>
              <span className="font-medium">{stats?.conceptsLearned || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quizzes Completed</span>
              <span className="font-medium">{stats?.quizzesCompleted || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Streak</span>
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
              <Badge variant="outline" className="gap-1">
                <Star className="h-3 w-3" /> First Scan
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Award className="h-3 w-3" /> Quiz Master
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Trophy className="h-3 w-3" /> 7 Day Streak
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
