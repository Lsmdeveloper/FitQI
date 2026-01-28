/**
 * Soma os pesos da resposta atual no score acumulado
 * @param {Object} scoreAtual - score acumulado até agora
 * @param {Object} weights - pesos da opção escolhida
 * @returns {Object} novo score atualizado
 */
export function addWeights(scoreAtual, weights) {
  const novoScore = { ...scoreAtual };

  for (const perfil in weights) {
    novoScore[perfil] = (novoScore[perfil] ?? 0) + weights[perfil];
  }

  return novoScore;
}

/**
 * Retorna o perfil com maior pontuação
 * @param {Object} score - score final
 * @returns {string|null} id do perfil vencedor (ex: "P3")
 */
export function getWinner(score) {
  const entries = Object.entries(score);

  if (entries.length === 0) return null;

  entries.sort((a, b) => b[1] - a[1]);

  return entries[0][0];
}
