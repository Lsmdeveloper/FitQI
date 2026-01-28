export const weightLossQuiz = {
  id: "weight_loss",
  title: "Diagnóstico FitIQ — Emagrecimento",
  metrics: { enabled: true },
  profiles: {
    P1: { title: "Emagrecimento Rápido (Iniciante)", desc: "Plano simples e direto para começar." },
    P2: { title: "Platô (Travado)", desc: "Ajustes para destravar e voltar a perder peso." },
    P3: { title: "Emocional / Ansiedade", desc: "Estratégias para controlar compulsão e rotina." },
    P4: { title: "Definição / Gordura Localizada", desc: "Ajuste fino para secar e definir." },
    P5: { title: "Falta de Tempo", desc: "Plano prático para rotina corrida." },
  },
  questions: [
    {
      id: "goal",
      title: "Qual seu objetivo principal?",
      options: [
        { label: "Perder muito peso rápido", weights: { P1: 3 } },
        { label: "Destravar emagrecimento (platô)", weights: { P2: 3 } },
        { label: "Secar gordura localizada / definir", weights: { P4: 3 } },
        { label: "Emagrecer com rotina corrida", weights: { P5: 3 } },
        { label: "Controlar fome/ansiedade", weights: { P3: 3 } },
      ],
    },
    {
        id: "difficulty",
        title: "Qual sua MAIOR dificuldade hoje?",
        options: [
            { label: "Ansiedade / compulsão", weights: { P3: 4 } },
            { label: "Falta de tempo", weights: { P5: 4 } },
            { label: "Fome (não consigo manter)", weights: { P1: 2, P3: 1 } },
            { label: "Não vejo resultado (travado)", weights: { P2: 4 } },
            { label: "Falta de constância/disciplina", weights: { P1: 2, P5: 1 } },
        ],
    },
    {
        id: "routine",
        title: "Como é sua rotina?",
        options: [
            { label: "Muito corrida, quase não cozinho", weights: { P5: 4 } },
            { label: "Normal, consigo cozinhar às vezes", weights: { P1: 1, P2: 1 } },
            { label: "Tenho tempo e consigo organizar", weights: { P2: 1, P4: 1 } },
        ],
    },
    {
        id: "attempts",
        title: "Você já tentou emagrecer antes?",
        options: [
            { label: "Nunca (primeira vez)", weights: { P1: 3 } },
            { label: "Já tentei e sempre volto", weights: { P1: 1, P3: 1 } },
            { label: "Já emagreci e travei", weights: { P2: 3 } },
            { label: "Já tenho boa rotina, quero definir", weights: { P4: 2 } },
        ],
    },
    {
        id: "food",
        title: "Como é sua alimentação hoje?",
        options: [
            { label: "Como muito à noite", weights: { P1: 2, P3: 1 } },
            { label: "Belisco o dia inteiro", weights: { P3: 3 } },
            { label: "Como pouco e mesmo assim não emagreço", weights: { P2: 3 } },
            { label: "Como ok, só falta definir", weights: { P4: 3 } },
            { label: "Como fora/pedido quase todo dia", weights: { P5: 3 } },
        ],
    },
    {
        id: "training",
        title: "Você treina atualmente?",
        options: [
            { label: "Não treino", weights: { P1: 1 } },
            { label: "1–2x por semana", weights: { P1: 1, P2: 1 } },
            { label: "3–5x por semana", weights: { P2: 1, P4: 2 } },
            { label: "5x+ e quero definir", weights: { P4: 3 } },
        ],
    },
    {
        id: "scenario",
        title: "Qual frase mais parece com você?",
        options: [
            { label: "Preciso de um plano simples pra começar logo", weights: { P1: 3 } },
            { label: "Faço tudo e o peso não desce", weights: { P2: 3 } },
            { label: "Quando fico ansioso, desconto na comida", weights: { P3: 4 } },
            { label: "Quero secar barriga e ficar definido", weights: { P4: 3 } },
            { label: "Minha rotina é corrida, preciso de algo prático", weights: { P5: 3 } },
        ],
    },
  ],
};
