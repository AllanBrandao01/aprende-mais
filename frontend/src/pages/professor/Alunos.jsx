import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import styles from './Alunos.module.css';

export function Alunos() {
  const { token } = useAuth();
  const [alunos, setAlunos] = useState(null);
  const [erro, setErro] = useState('');
  const [filtroTurma, setFiltroTurma] = useState('todas');
  const [filtroSituacao, setFiltroSituacao] = useState('todos');

  useEffect(() => {
    api
      .listAlunos(token)
      .then(setAlunos)
      .catch((err) => setErro(err.message));
  }, [token]);

  const turmas = useMemo(() => {
    if (!alunos) return [];
    return [...new Set(alunos.map((a) => a.turma).filter(Boolean))].sort();
  }, [alunos]);

  const alunosFiltrados = alunos?.filter((a) => {
    if (filtroTurma !== 'todas' && a.turma !== filtroTurma) return false;
    if (filtroSituacao !== 'todos' && a.situacao !== filtroSituacao) return false;
    return true;
  });

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <h1>Alunos</h1>
        <Link to="/professor/alunos/novo" className={styles.botaoNovo}>
          + Novo aluno
        </Link>
      </div>

      {erro && (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      )}

      <div className={styles.filtros}>
        {turmas.length > 1 && (
          <label className={styles.filtro}>
            Turma
            <select value={filtroTurma} onChange={(e) => setFiltroTurma(e.target.value)}>
              <option value="todas">Todas</option>
              {turmas.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className={styles.filtro}>
          Situação
          <select value={filtroSituacao} onChange={(e) => setFiltroSituacao(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="em_reforco">Em reforço</option>
            <option value="apto_saida">Reforço concluído</option>
          </select>
        </label>
      </div>

      {alunos?.length === 0 && <p>Nenhum aluno cadastrado ainda.</p>}
      {alunos?.length > 0 && alunosFiltrados?.length === 0 && <p>Nenhum aluno encontrado com esse filtro.</p>}

      <div className={styles.lista}>
        {alunosFiltrados?.map((aluno) => (
          <Link to={`/professor/alunos/${aluno.id}`} key={aluno.id} className={styles.cartao}>
            <div>
              <strong>{aluno.nome}</strong>
              {aluno.turma && <span className={styles.turma}> — {aluno.turma}</span>}
            </div>
            <span className={aluno.situacao === 'apto_saida' ? styles.badgeApto : styles.badgeReforco}>
              {aluno.situacao === 'apto_saida' ? 'Reforço concluído' : 'Em reforço'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
