import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const { token } = useAuth();
  const [alunos, setAlunos] = useState(null);
  const [exercicios, setExercicios] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([api.listAlunos(token), api.listExercicios(token)])
      .then(([a, e]) => {
        setAlunos(a);
        setExercicios(e);
      })
      .catch((err) => setErro(err.message));
  }, [token]);

  const emReforcoLista = alunos?.filter((a) => a.situacao === 'em_reforco') ?? [];
  const emReforco = emReforcoLista.length;
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
          <span>Reforço concluído</span>
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
          <h2>Precisam de atenção</h2>
          <Link to="/professor/alunos" className={styles.verTodos}>
            Ver todos os alunos →
          </Link>
        </div>

        {alunos?.length > 0 && emReforcoLista.length === 0 && <p>Nenhum aluno em reforço no momento.</p>}
        {alunos?.length === 0 && <p>Nenhum aluno cadastrado ainda.</p>}

        <div className={styles.lista}>
          {emReforcoLista.map((aluno) => (
            <Link to={`/professor/alunos/${aluno.id}`} key={aluno.id} className={styles.linha}>
              <span>
                <strong>{aluno.nome}</strong>
                {aluno.turma && <span className={styles.turma}> — {aluno.turma}</span>}
              </span>
              <span className={styles.badgeReforco}>Em reforço</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
