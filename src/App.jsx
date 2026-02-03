import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import WeightLossQuizPage from "./pages/QuizPage";
import Header from "./components/Header"
import Footer from "./components/Footer"
import Thanks from "./pages/Thanks";


export default function App() {
  return (
    <>
      <Header/>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quiz/emagrecimento" element={<WeightLossQuizPage />} />
        <Route path="/thanks" element={<Thanks />} />
      </Routes>
    <Footer/>
    </>
  );
}
