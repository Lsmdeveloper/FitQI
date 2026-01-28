import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-2xl border p-6">
        <h1 className="text-3xl font-bold">FitIQ</h1>
        <p className="mt-2 opacity-80">
          Descubra o plano ideal para o seu corpo em 2 minutos.
        </p>

        <button
          onClick={() => navigate("/quiz/emagrecimento")}
          className="mt-6 w-full rounded-xl border p-3 font-semibold"
        >
          Começar diagnóstico
        </button>
      </div>
    </div>
  );
}
