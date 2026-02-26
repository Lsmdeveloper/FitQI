import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Thanks() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const GUIDE_URL = import.meta.env.VITE_GUIDE_URL; 
  const CALENDAR_URL = import.meta.env.VITE_CALENDAR_URL;
  const SHEET_URL = import.meta.env.VITE_SHEET_URL;

  const [loading, setLoading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [approved, setApproved] = useState(false);
  const [hasUpsell, setHasUpsell] = useState(false);
  const [error, setError] = useState("");

  const paymentId = useMemo(  
    () => localStorage.getItem("fitiq_payment_id") || "",
    []
  );

  function detectUpsell(data) {
    return (
      Boolean(data?.upsell) ||
      Boolean(data?.meta?.upsell) ||
      Boolean(data?.extras?.upsell) ||
      data?.plan === "UPSELL" ||
      data?.product === "upsell"
    );
  }

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
          if (!alive) return;
          setError("Não foi possível validar seu pagamento agora.");
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (!alive) return;

        if (data?.status !== "approved") {
          setApproved(false);
          setError("Pagamento ainda não aprovado. Tente novamente em instantes.");
          setLoading(false);
          return;
        }

        setApproved(true);
        setHasUpsell(detectUpsell(data));

        const token = data?.download?.token;
        if (token) {
          setDownloadUrl(`${API_URL}/download/${paymentId}?token=${token}`);
        } else {
          
          setDownloadUrl("");
          setError("Pagamento aprovado, mas não foi possível gerar o download agora.");
        }

        if (typeof window !== "undefined" && typeof window.fbq === "function") {
          const key = `fitiq_purchase_${paymentId}`;
          if (!sessionStorage.getItem(key)) {
            window.fbq("track", "Purchase", { value: 19.9, currency: "BRL" });
            sessionStorage.setItem(key, "1");
          }
        }

        setLoading(false);

      } catch (e) {
        if (!alive) return;
        setError("Erro ao validar seu pagamento. Verifique sua conexão.");
        setLoading(false);
      }
    };

    run();

    return () => {
      alive = false;
    };
  }, [API_URL, paymentId, navigate]);

  const upsellLinksConfigured =
    Boolean(GUIDE_URL) && Boolean(CALENDAR_URL) && Boolean(SHEET_URL);

  const handleGoHome = () => {
    localStorage.removeItem("fitiq_payment_id");
    navigate("/");
  };

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
          Compra confirmada. Seu acesso está liberado abaixo.
        </p>

        {hasUpsell && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="font-semibold">Como usar (rápido)</p>
            <ul className="mt-2 space-y-2 text-sm text-white/80 list-disc pl-5">
              <li>Abra o <b>Guia</b> e siga o dia correspondente.</li>
              <li>Imprima o <b>Calendário</b> e marque seu progresso.</li>
              <li>
                Na <b>Planilha</b>, clique em <b>Arquivo → Fazer uma cópia</b> para editar.
              </li>
            </ul>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {loading ? (
            <button
              type="button"
              disabled
              className="w-full rounded-2xl bg-white/10 py-3 font-semibold text-white/70 border border-white/10"
            >
              Preparando seu download...
            </button>
          ) : !approved ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              {error || "Não foi possível liberar seu acesso agora."}
            </div>
          ) : (
            <>
              {/* ✅ BOTÃO DO EBOOK (sempre para compra normal) */}
              {downloadUrl ? (
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
                  {error || "Pagamento aprovado, mas não foi possível gerar o link agora."}
                </div>
              )}

              {/* ✅ LINKS DO UPSELL (só se comprou upsell) */}
              {hasUpsell && (
                <>
                  {!upsellLinksConfigured ? (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                      Links do upsell não configurados. Defina VITE_GUIDE_URL, VITE_CALENDAR_URL e
                      VITE_SHEET_URL no .env.
                    </div>
                  ) : (
                    <>
                      <a
                        href={GUIDE_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="
                          block w-full rounded-2xl py-3 text-center font-semibold
                          bg-white/10 text-white
                          hover:scale-[1.01] active:scale-[0.99]
                          transition
                          border border-white/10
                        "
                      >
                        Abrir o Guia 21 Dias (PDF) →
                        <span className="block text-xs font-normal text-white/70 mt-0.5">
                          Abra e siga o dia
                        </span>
                      </a>

                      <a
                        href={CALENDAR_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="
                          block w-full rounded-2xl py-3 text-center font-semibold
                          bg-white/10 text-white
                          hover:scale-[1.01] active:scale-[0.99]
                          transition
                          border border-white/10
                        "
                      >
                        Baixar Calendário de Check-in (PDF) →
                        <span className="block text-xs font-normal text-white/70 mt-0.5">
                          Imprima e marque
                        </span>
                      </a>

                      <a
                        href={SHEET_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="
                          block w-full rounded-2xl py-3 text-center font-semibold
                          bg-white/10 text-white
                          hover:scale-[1.01] active:scale-[0.99]
                          transition
                          border border-white/10
                        "
                      >
                        Abrir Planilha de Treino (Sheets) →
                        <span className="block text-xs font-normal text-white/70 mt-0.5">
                          Arquivo → Fazer uma cópia
                        </span>
                      </a>
                    </>
                  )}
                </>
              )}
            </>
          )}

          <button
            type="button"
            onClick={handleGoHome}
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