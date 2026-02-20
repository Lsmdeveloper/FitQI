import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Thanks() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [loading, setLoading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");

  const paymentId = useMemo(() => {
    return localStorage.getItem("fitiq_payment_id") || "";
  }, []);

  useEffect(() => {
    if (!paymentId) {
      navigate("/", { replace: true });
      return;
    }

    let alive = true;

    const run = async () => {
      try {
        const res = await fetch(`${API_URL}/payment-status/${paymentId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          navigate("/", { replace: true });
          return;
        }

        const data = await res.json();

        if (!alive) return;

        // 🔥 BLOQUEIO PRINCIPAL
        if (data?.status !== "approved" || !data?.download?.token) {
          navigate("/", { replace: true });
          return;
        }

        setDownloadUrl(
          `${API_URL}/download/${paymentId}?token=${data.download.token}`
        );

        setLoading(false);
      } catch (e) {
        if (!alive) return;
        navigate("/", { replace: true });
      }
    };

    run();

    return () => {
      alive = false;
    };
  }, [API_URL, paymentId, navigate]);

  return (
    <div className="min-h-[80dvh] grid place-items-center p-4 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl shadow-black/40 text-white">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Obrigado!</h1>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-300">
            ✓
          </span>
        </div>

        <p className="mt-2 text-white/80">
          Seu diagnóstico foi concluído e seu plano já está sendo preparado.
        </p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="font-semibold">Próximos passos</p>
          <ul className="mt-2 space-y-2 text-sm text-white/80 list-disc pl-5">
            <li>Verifique seu e-mail (e a caixa de spam) para acessar seu plano.</li>
            <li>Se você ainda não recebeu, aguarde alguns minutos.</li>
            <li>Dúvidas? Clique em “Contato” no topo da página.</li>
          </ul>
        </div>

        <div className="mt-6 space-y-3">
        {loading ? (
          <button
            type="button"
            disabled
            className="w-full rounded-2xl bg-white/10 py-3 font-semibold text-white/70 border border-white/10"
          >
            Preparando seu download...
          </button>
        ) : downloadUrl ? (
          <a
            href={downloadUrl}
            className="
              block w-full rounded-2xl py-3 text-center font-semibold
              bg-white text-neutral-900
              hover:scale-[1.01] active:scale-[0.99]
              transition
              shadow-lg shadow-black/30
            "
          >
            Baixar meu eBook agora ↓
            <span className="block text-xs font-normal text-neutral-600 mt-0.5">
              PDF (abre no celular e PC)
            </span>
          </a>
        ) : (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            {error || "Não foi possível gerar o link agora."}
          </div>
        )}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full rounded-2xl bg-white py-3 font-semibold text-neutral-900"
          >
            Voltar para o início →
          </button>

          <button
            type="button"
            onClick={() => navigate("/quiz/emagrecimento")}
            className="w-full rounded-2xl border border-white/20 bg-transparent py-3 font-semibold text-white"
          >
            Refazer diagnóstico
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-white/50">
          Seus dados não serão compartilhados • FitIQ © 2026
        </p>
      </div>
    </div>
  );
}