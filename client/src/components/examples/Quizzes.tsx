import Quizzes from "../../pages/Quizzes";
import { Router } from "wouter";

export default function QuizzesExample() {
  return (
    <Router>
      <div className="p-8">
        <Quizzes />
      </div>
    </Router>
  );
}
