import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80dvh] bg-[#000000] text-white flex items-center justify-center p-6">
      <div className="max-w-xl bg-[#14379e] shadow-[0_10px_40px_rgba(0,0,0,0.25)] w-full rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold">FitIQ</h1>
        <p className="mt-2 opacity-80">
          Descubra o plano ideal para o seu corpo em 2 minutos.
        </p>

        <button
          onClick={() => navigate("/quiz/emagrecimento")}
          className="
            mt-4 w-full rounded-xl
            bg-white text-blue-900 font-semibold py-3
            relative overflow-hidden
            transition-all duration-200 ease-out
            hover:bg-blue-100
            hover:scale-[1.03]
            hover:shadow-[0_16px_40px_rgba(0,0,0,0.25)]
            active:scale-[0.98]
          "
        >
          Começar diagnóstico <span className="text-blue-600">→</span>
          
        </button>
      </div>
    </div>
  );
}
