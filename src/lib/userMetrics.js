export function calcBmi(heightCm, weightKg) {
  const h = Number(heightCm) / 100;
  const w = Number(weightKg);
  if (!h || !w) return null;
  return w / (h * h);
}

export function bmiLabel(bmi) {
  if (bmi == null) return null;
  if (bmi < 18.5) return "abaixo do peso";
  if (bmi < 25) return "zona saudável";
  if (bmi < 30) return "acima do ideal";
  if (bmi < 35) return "obesidade (grau I)";
  if (bmi < 40) return "obesidade (grau II)";
  return "obesidade (grau III)";
}

export function suggestTargetKg(weightKg) {
  const w = Number(weightKg);
  if (!w) return null;
  const minKg = Math.max(2, Math.round(w * 0.03));
  const maxKg = Math.max(3, Math.round(w * 0.05));
  return { minKg, maxKg };
}

export function activityTip(activity) {
  switch (activity) {
    case "sedentario":
      return "Começaremos com passos simples: caminhada + rotina alimentar consistente.";
    case "leve":
      return "Você já tem base: vamos focar em consistência e déficit sem sofrimento.";
    case "moderado":
      return "Com esse ritmo de treino, dá pra acelerar ajustando alimentação e recuperação.";
    case "alto":
      return "Seu treino é forte: vamos proteger performance e acelerar a perda com estratégia.";
    default:
      return null;
  }
}
