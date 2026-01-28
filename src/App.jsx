import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import WeightLossQuizPage from "./pages/QuizPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/quiz/emagrecimento" element={<WeightLossQuizPage />} />
    </Routes>
  );
}
