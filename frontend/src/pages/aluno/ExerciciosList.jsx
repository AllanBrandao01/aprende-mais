import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import styles from './ExerciciosList.module.css';

const NOME_DISCIPLINA = { portugues: 'Português', matematica: 'Matemática' };

export function ExerciciosListAluno() {
  const { token, user } = useAuth();
  const [exercicios, setExercicios] = useState(null);
  const [erro, setErro] = useState('');
  const [disciplina, setDisciplina] = useState('todas');
  const [status, setStatus] = useState('todos');

  useEffect(() => {
    api
      .listExercicios(token)
      .then(setExercicios)
      .catch((err) => setErro(err.message));
  }, [token]);

  const pendentes = exercicios?.filter((e) => !e.concluido).length ?? 0;
  const concluidos = exercicios?.filter((e) => e.concluido).length ?? 0;
  const comNota = exercicios?.filter((e) => e.percentual !== null) ?? [];
  const desempenhoMedio = comNota.length
    ? Math.round(comNota.reduce((soma, e) => soma + e.percentual, 0) / comNota.length)
    : null;

  const filtrados = exercicios?.filter((e) => {
    if (disciplina !== 'todas' && e.disciplina !== disciplina) return false;
    if (status === 'pendentes' && e.concluido) return false;
    if (status === 'concluidos' && !e.concluido) return false;
    return true;
  });

  return (
    <div className={styles.pagina}>
      <h1>Olá, {user.nome.split(' ')[0]}!</h1>

      {erro && (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      )}

      <div className={styles.resumo}>
        <div className={styles.resumoItem}>
          <span className={styles.resumoNumero}>{pendentes}</span>
          <span>Pendentes</span>
        </div>
        <div className={styles.resumoItem}>
          <span className={styles.resumoNumero}>{concluidos}</span>
          <span>Concluídos</span>
        </div>
        <div className={styles.resumoItem}>
          <span className={styles.resumoNumero}>{desempenhoMedio !== null ? `${desempenhoMedio}%` : '—'}</span>
          <span>Desempenho médio</span>
        </div>
      </div>

      <div className={styles.filtros}>
        <div className={styles.grupoFiltro} role="group" aria-label="Filtrar por disciplina">
          {[
            ['todas', 'Todas'],
            ['portugues', 'Português'],
            ['matematica', 'Matemática'],
          ].map(([valor, rotulo]) => (
            <button
              key={valor}
              className={disciplina === valor ? styles.filtroAtivo : styles.filtroBotao}
              aria-pressed={disciplina === valor}
              onClick={() => setDisciplina(valor)}
            >
              {rotulo}
            </button>
          ))}
        </div>
        <div className={styles.grupoFiltro} role="group" aria-label="Filtrar por status">
          {[
            ['todos', 'Todos'],
            ['pendentes', 'Pendentes'],
            ['concluidos', 'Concluídos'],
          ].map(([valor, rotulo]) => (
            <button
              key={valor}
              className={status === valor ? styles.filtroAtivo : styles.filtroBotao}
              aria-pressed={status === valor}
              onClick={() => setStatus(valor)}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      {filtrados?.length === 0 && <p>Nenhum exercício encontrado com esse filtro.</p>}

      <div className={styles.lista}>
        {filtrados?.map((ex) => (
          <Link to={`/aluno/${ex.id}`} key={ex.id} className={styles.cartao}>
            <div>
              <strong>{ex.titulo}</strong>
              <span className={styles.tag}>{NOME_DISCIPLINA[ex.disciplina]}</span>
            </div>
            {ex.serie && <p>Série: {ex.serie}</p>}
            <span className={ex.concluido ? styles.badgeConcluido : styles.badgePendente}>
              {ex.concluido ? `Concluído — ${ex.percentual}%` : 'Pendente'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
