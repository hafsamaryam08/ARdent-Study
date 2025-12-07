import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, queryClient, apiRequest } from "@/lib/queryClient";
import { Trophy, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface Concept {
  id: string;
  term: string;
  definition: string;
  category?: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  score?: number;
  completed: boolean;
}

export default function Quizzes() {
  const { toast } = useToast();
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const { data: quizzes, isLoading, refetch } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: concepts } = useQuery<Concept[]>({
    queryKey: ["/api/concepts"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const generateQuizMutation = useMutation({
    mutationFn: async (conceptId: string) => {
      const res = await apiRequest("POST", "/api/quizzes/generate", { conceptId });
      return res.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Success",
        description: "Quiz generated successfully!",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to generate quiz",
        variant: "destructive",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/quizzes/${selectedQuiz}/submit`, { answers });
      return res.json();
    },
    onSuccess: (data: any) => {
      setFinalScore(data.score || 0);
      setShowScore(true);
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({
        title: "Quiz Completed!",
        description: `Your score: ${data.score || 0}%`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to submit quiz",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading quizzes...</div>;
  }

  const quiz = quizzes?.find((q) => q.id === selectedQuiz);

  if (selectedQuiz && quiz) {
    if (showScore) {
      return (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold mb-4">{quiz.title}</h1>
            <p className="text-muted-foreground mb-8">Quiz Completed!</p>
          </div>

          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-12 text-center space-y-6">
              <div className="text-7xl font-bold text-primary">{finalScore}%</div>
              <div className="space-y-2">
                <p className="text-lg font-semibold">Your Score</p>
                <p className="text-muted-foreground">
                  You answered {Math.round((finalScore / 100) * quiz.questions.length)} out of {quiz.questions.length} questions correctly
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedQuiz(null);
                setShowScore(false);
                setAnswers({});
                setCurrentQuestion(0);
              }}
            >
              Back to Quizzes
            </Button>
            <Button
              onClick={() => {
                setShowScore(false);
                setAnswers({});
                setCurrentQuestion(0);
              }}
            >
              Retake Quiz
            </Button>
          </div>
        </div>
      );
    }

    const question = quiz.questions[currentQuestion];
    const totalQuestions = quiz.questions.length;
    const progress = ((currentQuestion + 1) / totalQuestions) * 100;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">{quiz.title}</h1>
          <p className="text-muted-foreground">
            Question {currentQuestion + 1} of {totalQuestions}
          </p>
        </div>

        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all" 
            style={{ width: `${progress}%` }}
          />
        </div>

        <Card>
          <CardContent className="p-8 space-y-6">
            <h2 className="text-xl font-semibold">{question.question}</h2>

            <div className="space-y-3">
              {question.options.map((option: string, idx: number) => (
                <label 
                  key={idx} 
                  className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted"
                  data-testid={`radio-option-${idx}`}
                >
                  <input
                    type="radio"
                    name="answer"
                    checked={answers[currentQuestion] === option}
                    onChange={() => setAnswers({ ...answers, [currentQuestion]: option })}
                    className="w-4 h-4"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3 justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                data-testid="button-previous"
              >
                Previous
              </Button>

              {currentQuestion < totalQuestions - 1 ? (
                <Button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  disabled={!answers[currentQuestion]}
                  data-testid="button-next"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                  data-testid="button-submit"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">Quizzes</h1>
        <p className="text-muted-foreground">Test your knowledge with AI-generated quizzes</p>
      </div>

      {concepts && Array.isArray(concepts) && concepts.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Generate New Quiz</CardTitle>
            <CardDescription>Create an AI-powered quiz from your learned concepts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {concepts.slice(0, 6).map((concept: Concept) => (
                <Button
                  key={concept.id}
                  variant="outline"
                  size="sm"
                  onClick={() => generateQuizMutation.mutate(concept.id)}
                  disabled={generateQuizMutation.isPending}
                  data-testid={`button-generate-quiz-${concept.id}`}
                >
                  {generateQuizMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {concept.term}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {quizzes && quizzes.length > 0 ? (
          quizzes.map((quiz) => (
            <Card key={quiz.id} className="hover-elevate">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription>
                      {quiz.questions.length} questions
                      {quiz.completed && ` • Score: ${quiz.score}%`}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedQuiz(quiz.id);
                      setCurrentQuestion(0);
                      setAnswers({});
                    }}
                    disabled={quiz.completed}
                  >
                    {quiz.completed ? "Completed" : "Take Quiz"}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No quizzes yet. Scan content to generate quizzes!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
