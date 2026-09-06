// Cruza exercícios + questões + respostas de UM aluno para calcular, por exercício,
// quantas questões existem, quantas foram respondidas e o % de acerto.
// Dissertativas entram na contagem de "respondidas" (para concluido) mas não têm
// gabarito automático, então ficam de fora do percentual (correta = null).
export function calcularProgresso(exerciciosBase, questoes, respostas) {
  const exercicioDaQuestao = {};
  const totalPorExercicio = {};
  questoes.forEach((q) => {
    exercicioDaQuestao[q.id] = q.exercicio_id;
    totalPorExercicio[q.exercicio_id] = (totalPorExercicio[q.exercicio_id] || 0) + 1;
  });

  const respondidasPorExercicio = {};
  const objetivasPorExercicio = {};
  const acertosPorExercicio = {};
  respostas.forEach((r) => {
    const exId = exercicioDaQuestao[r.questao_id];
    if (!exId) return;
    respondidasPorExercicio[exId] = (respondidasPorExercicio[exId] || 0) + 1;
    if (r.correta !== null) {
      objetivasPorExercicio[exId] = (objetivasPorExercicio[exId] || 0) + 1;
      if (r.correta) acertosPorExercicio[exId] = (acertosPorExercicio[exId] || 0) + 1;
    }
  });

  return exerciciosBase.map((e) => {
    const total = totalPorExercicio[e.id] || 0;
    const respondidas = respondidasPorExercicio[e.id] || 0;
    const objetivas = objetivasPorExercicio[e.id] || 0;
    return {
      ...e,
      total_questoes: total,
      respondidas,
      concluido: total > 0 && respondidas >= total,
      acertos: acertosPorExercicio[e.id] || 0,
      total_objetivas: objetivas,
      percentual: objetivas > 0 ? Math.round((100 * (acertosPorExercicio[e.id] || 0)) / objetivas) : null,
    };
  });
}
