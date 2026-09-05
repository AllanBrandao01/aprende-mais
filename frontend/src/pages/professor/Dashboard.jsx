import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const { token } = useAuth();
  const [alunos, setAlunos] = useState(null);
  const [exercicios, setExercicios] = useState(null);
  const [erro, setErro] = useState('');
  const [filtroTurma, setFiltroTurma] = useState('todas');

  useEffect(() => {
    Promise.all([api.listAlunos(token), api.listExercicios(token)])
      .then(([a, e]) => {
        setAlunos(a);
        setExercicios(e);
      })
      .catch((err) => setErro(err.message));
  }, [token]);

  const turmas = useMemo(() => {
    if (!alunos) return [];
    return [...new Set(alunos.map((a) => a.turma).filter(Boolean))].sort();
  }, [alunos]);

  const alunosFiltrados = alunos?.filter((a) => filtroTurma === 'todas' || a.turma === filtroTurma);
  const emReforco = alunos?.filter((a) => a.situacao === 'em_reforco').length ?? 0;
  const aptoSaida = alunos?.filter((a) => a.situacao === 'apto_saida').length ?? 0;

  return (
    <div className={styles.pagina}>
      <h1>Painel do professor</h1>

      {erro && (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      )}

      <div className={styles.cards}>
        <div className={styles.card}>
          <span className={styles.numero}>{alunos?.length ?? '—'}</span>
          <span>Alunos</span>
        </div>
        <div className={styles.card}>
          <span className={styles.numero}>{emReforco}</span>
          <span>Em reforço</span>
        </div>
        <div className={styles.card}>
          <span className={styles.numero}>{aptoSaida}</span>
          <span>Aptos a sair</span>
        </div>
        <div className={styles.card}>
          <span className={styles.numero}>{exercicios?.length ?? '—'}</span>
          <span>Exercícios criados</span>
        </div>
      </div>

      <div className={styles.acoes}>
        <Link to="/professor/alunos/novo" className={styles.botaoSecundario}>
          + Novo aluno
        </Link>
        <Link to="/professor/novo" className={styles.botaoSecundario}>
          + Novo exercício
        </Link>
      </div>

      <div className={styles.blocoLista}>
        <div className={styles.blocoTopo}>
          <h2>Alunos</h2>
          {turmas.length > 1 && (
            <select value={filtroTurma} onChange={(e) => setFiltroTurma(e.target.value)}>
              <option value="todas">Todas as turmas</option>
              {turmas.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>

        {alunosFiltrados?.length === 0 && <p>Nenhum aluno nessa turma.</p>}

        <div className={styles.lista}>
          {alunosFiltrados?.map((aluno) => (
            <Link to={`/professor/alunos/${aluno.id}`} key={aluno.id} className={styles.linha}>
              <span>
                <strong>{aluno.nome}</strong>
                {aluno.turma && <span className={styles.turma}> — {aluno.turma}</span>}
              </span>
              <span className={aluno.situacao === 'apto_saida' ? styles.badgeApto : styles.badgeReforco}>
                {aluno.situacao === 'apto_saida' ? 'Apto a sair' : 'Em reforço'}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
