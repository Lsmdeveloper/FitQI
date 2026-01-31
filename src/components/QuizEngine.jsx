import { useMemo, useState } from "react";
import { addWeights, getWinner } from "../lib/quizScoring";
import {
  calcBmi,
  bmiLabel,
  suggestTargetKg,
  activityTip,
} from "../lib/userMetrics";

export default function QuizEngine({ quiz }) {
  const { id: quizId, title, questions, profiles } = quiz;
  const metricsEnabled = quiz?.metrics?.enabled ?? false;

  const [step, setStep] = useState(0);
  const [score, setScore] = useState({});
  const [metricsDone, setMetricsDone] = useState(false);
  const [metrics, setMetrics] = useState({
    ageRange: "",
    heightCm: "",
    weightKg: "",
    activity: "",
  });

  const [email, setEmail] = useState("");
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const [payLoading, setPayLoading] = useState(false);

  const done = step >= questions.length;
  const showMetrics = done && metricsEnabled && !metricsDone;
  const showResult = done && (!metricsEnabled || metricsDone);
  
  const winnerId = useMemo(() => {
    return done ? getWinner(score) : null;
  }, [done, score]);

  const current = !done ? questions[step] : null;

  const handleAnswer = (optionIndex) => {
    if (!current) return;

    const option = current.options[optionIndex];
    setScore((prev) => addWeights(prev, option.weights));
    setStep((s) => s + 1);
  };

  const reset = () => {
    setStep(0);
    setScore({});
    setMetricsDone(false);
    setMetrics({
      ageRange: "",
      heightCm: "",
      weightKg: "",
      activity: "",
    });
  };

  async function startCheckout() {
    if (payLoading) return;

    if (!emailOk) {
      alert("Digite um e-mail válido para continuar.");
      return;
    }

    try {
      setPayLoading(true);

      const res = await fetch("http://localhost:3333/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, winnerId, metrics, score, email }),
      });

      if (!res.ok) throw new Error("Erro ao criar pagamento");

      const data = await res.json();
      window.location.href = data.checkoutUrl;
    } catch (err) {
      console.error(err);
      alert("Erro ao iniciar pagamento. Tente novamente.");
      setPayLoading(false);
    }
  }


  if (showMetrics) {
    const height = Number(metrics.heightCm);
    const weight = Number(metrics.weightKg);
    const canContinue =
      metrics.ageRange && metrics.activity && height > 50 && weight > 20;

    return (
      <div className="min-h-screen grid place-items-center p-6 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="absolute inset-0 opacity-60 [background:radial-gradient(800px_circle_at_50%_20%,rgba(255,255,255,0.08),transparent_60%)]" />

        <div className="relative w-full flex justify-center">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl shadow-black/40">
            <p className="text-xs tracking-wide text-white/60">{title}</p>

            <h1 className="text-2xl sm:text-3xl font-semibold mt-5 text-white">
              Quase pronto 👇
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Isso leva 15 segundos e deixa seu plano mais preciso.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs text-white/60">Idade</label>
                <select
                  value={metrics.ageRange}
                  onChange={(e) =>
                    setMetrics((m) => ({ ...m, ageRange: e.target.value }))
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-900 text-white p-3 outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="">Selecione</option>
                  <option value="18-24">18–24</option>
                  <option value="25-34">25–34</option>
                  <option value="35-44">35–44</option>
                  <option value="45-54">45–54</option>
                  <option value="55+">55+</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60">Altura (cm)</label>
                  <input
                    inputMode="numeric"
                    value={metrics.heightCm}
                    onChange={(e) =>
                      setMetrics((m) => ({ ...m, heightCm: e.target.value }))
                    }
                    placeholder="Ex: 180"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Peso (kg)</label>
                  <input
                    inputMode="numeric"
                    value={metrics.weightKg}
                    onChange={(e) =>
                      setMetrics((m) => ({ ...m, weightKg: e.target.value }))
                    }
                    placeholder="Ex: 101"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/60">
                  Nível de atividade
                </label>
                <select
                  value={metrics.activity}
                  onChange={(e) =>
                    setMetrics((m) => ({ ...m, activity: e.target.value }))
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-900 text-white p-3 outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="">Selecione</option>
                  <option value="sedentario">Sedentário</option>
                  <option value="leve">Treino 1–2x/semana</option>
                  <option value="moderado">Treino 3–5x/semana</option>
                  <option value="alto">Treino 6x+/semana</option>
                </select>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                disabled={!canContinue}
                onClick={() => setMetricsDone(true)}
                className="w-full rounded-2xl bg-zinc-100 text-zinc-900 p-4 font-semibold
                            hover:opacity-95 transition active:scale-[0.99]
                            disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Ver meu resultado
              </button>

              <button
                onClick={() => setMetricsDone(true)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 hover:bg-white/10 transition"
              >
                Pular (não recomendado)
              </button>
            </div>

            <p className="mt-6 text-xs text-white/50">
              🔒 Seus dados não serão compartilhados
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showResult && winnerId != null) {
    const bmi = metricsEnabled
      ? calcBmi(metrics.heightCm, metrics.weightKg)
      : null;
    const bmiText = bmi ? bmiLabel(bmi) : null;
    const target = metricsEnabled ? suggestTargetKg(metrics.weightKg) : null;
    const tip = metricsEnabled ? activityTip(metrics.activity) : null;
    return (
      <div className="min-h-screen grid place-items-center p-6 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="absolute inset-0 opacity-60 [background:radial-gradient(800px_circle_at_50%_20%,rgba(255,255,255,0.08),transparent_60%)]" />

        <div className="relative w-full flex justify-center">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl shadow-black/40">
            <p className="text-xs tracking-wide text-white/60">{title}</p>

            <h1 className="text-2xl sm:text-3xl font-semibold mt-5 text-white">
              Seu perfil
            </h1>

            <p className="mt-3 text-lg text-white">
              <strong>{profiles[winnerId].title}</strong>
            </p>

            <p className="mt-2 text-sm text-white/70">
              {profiles[winnerId].desc}
            </p>
            <p className="mt-3 text-sm text-white/70">
              Seu plano foi preparado. Falta só liberar o acesso.
            </p>
            {metricsEnabled && bmi && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/80">
                  IMC estimado:{" "}
                  <span className="font-semibold text-white">
                    {bmi.toFixed(1)}
                  </span>{" "}
                  <span className="text-white/60">({bmiText})</span>
                </p>

                {target && (
                  <p className="mt-2 text-sm text-white/70">
                    Meta inicial sugerida:{" "}
                    <span className="font-semibold text-white">
                      -{target.minKg} a -{target.maxKg} kg em 30 dias
                    </span>
                  </p>
                )}

                {tip && <p className="mt-2 text-sm text-white/70">{tip}</p>}
              </div>
            )}
            <div className="mt-5">
              <label className="text-xs text-white/60">Seu melhor e-mail</label>

              <input
                type="email"
                placeholder="ex: seuemail@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/20"
                required
              />

              {!emailOk && email.length > 3 && (
                <p className="mt-2 text-xs text-white/50">
                  Vamos enviar seu plano e o acesso por esse e-mail.
                </p>
              )}
            </div>
            <div className="mt-6 space-y-3">
              <button
                onClick={startCheckout}
                disabled={payLoading || !emailOk}
                className="cta-breathe w-full rounded-2xl bg-zinc-100 text-zinc-900 p-4 font-semibold
                          hover:opacity-95 transition active:scale-[0.99]
                          disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {payLoading ? "Redirecionando..." : "Desbloquear meu plano por R$ 19,90"}
              </button>
              <button
                onClick={reset}
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white/90 hover:bg-white/10 transition"
              >
                Refazer diagnóstico
              </button>
            </div>

            <p className="mt-6 text-xs text-white/50">
              🔒 Seus dados não serão compartilhados
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Caso raro: quiz acabou mas ainda não tem winnerId (score vazio)
  if (done) {
    return (
      <div className="min-h-screen grid place-items-center p-6 bg-neutral-950 text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p>Não foi possível calcular seu perfil. Tente novamente.</p>
          <button
            onClick={reset}
            className="mt-4 w-full rounded-xl bg-white text-neutral-900 p-3 font-semibold"
          >
            Recomeçar
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="absolute inset-0 opacity-60 [background:radial-gradient(800px_circle_at_50%_20%,rgba(255,255,255,0.08),transparent_60%)]" />

      <div className="relative w-full flex justify-center">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between">
            <p className="text-xs tracking-wide text-white/60">{title}</p>
            <span className="text-xs text-white/60">
              {step + 1}/{questions.length}
            </span>
          </div>

          <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/60 transition-all duration-300"
              style={{ width: `${((step + 1) / questions.length) * 100}%` }}
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold mt-5 text-white">
            {current.title}
          </h1>

          <p className="mt-2 text-sm text-white/70">
            Responda com sinceridade — o plano é montado com base no seu perfil.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3">
            {current.options.map((opt, idx) => (
              <button
                key={opt.label}
                onClick={() => handleAnswer(idx)}
                className="group w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-white
                            hover:bg-white/10 hover:border-white/20 transition
                            active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-white/40 group-hover:text-white/70 transition">
                    →
                  </span>
                </div>
              </button>
            ))}
          </div>

          <p className="mt-6 text-xs text-white/50">
            ⏱ Leva menos de 2 minutos • 🔒 Seus dados não serão compartilhados
          </p>
        </div>
      </div>
    </div>
  );
}
