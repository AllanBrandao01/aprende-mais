import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import styles from './Resultados.module.css';

export function Resultados() {
  const { id } = useParams();
  const { token } = useAuth();
  const [exercicio, setExercicio] = useState(null);
  const [resultados, setResultados] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([api.getExercicio(id, token), api.resultados(id, token)])
      .then(([ex, res]) => {
        setExercicio(ex);
        setResultados(res);
      })
      .catch((err) => setErro(err.message));
  }, [id, token]);

  return (
    <div className={styles.pagina}>
      <Link to="/professor" className={styles.voltar}>
        ← Meus exercícios
      </Link>

      {erro && (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      )}
      {exercicio && (
        <>
          <h1>{exercicio.titulo}</h1>
          <p className={styles.subtitulo}>{exercicio.questoes.length} questão(ões)</p>
        </>
      )}

      <h2>Resultados dos alunos</h2>
      {resultados?.length === 0 && <p>Nenhum aluno respondeu ainda.</p>}
      <div className={styles.lista}>
        {resultados?.map((r) => (
          <div className={styles.linha} key={r.aluno_id}>
            <div>
              <strong>{r.aluno_nome}</strong>
              {r.aluno_turma && <span className={styles.turma}> — {r.aluno_turma}</span>}
            </div>
            <span className={styles.percentual}>
              {r.acertos}/{r.total_respondidas} ({r.percentual}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
