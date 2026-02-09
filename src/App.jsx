import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import WeightLossQuizPage from "./pages/QuizPage";
import Header from "./components/Header"
import Footer from "./components/Footer"
import Thanks from "./pages/Thanks";
import Support from "./pages/SupportPage";
import Terms from "./pages/Terms"
import Privacy from "./pages/Privacy";
import { initMercadoPago } from "@mercadopago/sdk-react";
import { useEffect  } from "react";


export default function App() {
  useEffect(() => {
    const pk = import.meta.env.VITE_MP_PUBLIC_KEY;

    if (!pk) {
      console.error("VITE_MP_PUBLIC_KEY não definida");
      return;
    }

    initMercadoPago(pk);
  }, []);

  return (
    <>
      <Header/>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quiz/emagrecimento" element={<WeightLossQuizPage />} />
        <Route path="/support" element={<Support />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/thanks" element={<Thanks />} />
      </Routes>
      <Footer/>
    </>
  );
}
