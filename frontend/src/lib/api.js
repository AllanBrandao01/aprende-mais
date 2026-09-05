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
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  listExercicios: (token) => request('/exercicios', { token }),
  getExercicio: (id, token) => request(`/exercicios/${id}`, { token }),
  criarExercicio: (payload, token) => request('/exercicios', { method: 'POST', body: payload, token }),
  responder: (exercicioId, payload, token) =>
    request(`/exercicios/${exercicioId}/respostas`, { method: 'POST', body: payload, token }),
  resultados: (exercicioId, token) => request(`/exercicios/${exercicioId}/resultados`, { token }),
  listAlunos: (token) => request('/alunos', { token }),
  atualizarSituacao: (alunoId, situacao, token) =>
    request(`/alunos/${alunoId}`, { method: 'PATCH', body: { situacao }, token }),
  evolucaoAluno: (alunoId, token) => request(`/alunos/${alunoId}/evolucao`, { token }),
};
