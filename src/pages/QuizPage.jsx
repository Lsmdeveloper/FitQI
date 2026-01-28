import QuizEngine from "../components/QuizEngine";
import { weightLossQuiz } from "../data/DataQuiz";

export default function WeightLossQuizPage() {
  return <QuizEngine quiz={weightLossQuiz} />;
}