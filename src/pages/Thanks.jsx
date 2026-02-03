import { useNavigate } from "react-router-dom";

export default function Thanks() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Obrigado! ✅
            </h1>
            <p className="mt-2 text-white/80">
              Seu diagnóstico foi concluído e seu plano já está sendo preparado.
            </p>
          </div>

          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-400/20">
            <span className="text-blue-200 text-xl">🎉</span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-black/30 border border-white/10 p-4">
          <p className="text-white/90 font-medium">Próximos passos</p>
          <ul className="mt-3 space-y-2 text-white/75 text-sm leading-relaxed">
            <li>• Verifique seu e-mail (e a caixa de spam) para acessar seu plano.</li>
            <li>• Se você ainda não recebeu, aguarde alguns minutos.</li>
            <li>• Dúvidas? Clique em “Suporte” no topo da página.</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/")}
            className="
              group w-full rounded-xl bg-white text-blue-900 font-semibold
              py-3 px-4 relative overflow-hidden
              transition-all duration-200 ease-out
              hover:bg-blue-50 hover:scale-[1.02]
              hover:shadow-[0_16px_40px_rgba(0,0,0,0.25)]
              active:scale-[0.98]
            "
          >
            <span className="inline-flex items-center justify-center gap-2">
              Voltar para o início
              <span className="text-blue-600 transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </span>
          </button>

          <button
            onClick={() => navigate("/quiz/emagrecimento")}
            className="
              w-full rounded-xl border border-white/20
              bg-white/0 text-white font-semibold
              py-3 px-4
              transition-all duration-200
              hover:bg-white/10 hover:border-white/30
              active:scale-[0.99]
            "
          >
            Refazer diagnóstico
          </button>
        </div>

        <p className="mt-5 text-xs text-white/50">
          Seus dados não serão compartilhados. • FitIQ © 2026
        </p>
      </div>
    </div>
  );
}
