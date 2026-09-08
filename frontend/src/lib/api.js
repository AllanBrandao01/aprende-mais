const BASE_URL = import.meta.env.VITE_API_URL;

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) throw new Error(data?.error || 'Erro na requisição');
  return data;
}

export const api = {
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  trocarSenha: (novaSenha, token) => request('/auth/senha', { method: 'PATCH', body: { novaSenha }, token }),
  listExercicios: (token) => request('/exercicios', { token }),
  getExercicio: (id, token) => request(`/exercicios/${id}`, { token }),
  criarExercicio: (payload, token) => request('/exercicios', { method: 'POST', body: payload, token }),
  atualizarExercicio: (id, payload, token) => request(`/exercicios/${id}`, { method: 'PUT', body: payload, token }),
  excluirExercicio: (id, token) => request(`/exercicios/${id}`, { method: 'DELETE', token }),
  responder: (exercicioId, payload, token) =>
    request(`/exercicios/${exercicioId}/respostas`, { method: 'POST', body: payload, token }),
  respostasExercicio: (exercicioId, alunoId, token) =>
    request(`/exercicios/${exercicioId}/respostas${alunoId ? `?aluno_id=${alunoId}` : ''}`, { token }),
  resultados: (exercicioId, token) => request(`/exercicios/${exercicioId}/resultados`, { token }),
  listAlunos: (token) => request('/alunos', { token }),
  criarAluno: (payload, token) => request('/alunos', { method: 'POST', body: payload, token }),
  atualizarSituacao: (alunoId, situacao, token) =>
    request(`/alunos/${alunoId}`, { method: 'PATCH', body: { situacao }, token }),
  exerciciosDoAluno: (alunoId, token) => request(`/alunos/${alunoId}/exercicios`, { token }),
  buscarAlunos: (termo, token) => request(`/alunos/buscar?q=${encodeURIComponent(termo)}`, { token }),
  resetarSenhaAluno: (alunoId, token) => request(`/alunos/${alunoId}/resetar-senha`, { method: 'PATCH', token }),
  listProfessores: (token) => request('/professores', { token }),
  criarProfessor: (payload, token) => request('/professores', { method: 'POST', body: payload, token }),
  resetarSenhaProfessor: (professorId, token) =>
    request(`/professores/${professorId}/resetar-senha`, { method: 'PATCH', token }),
};
