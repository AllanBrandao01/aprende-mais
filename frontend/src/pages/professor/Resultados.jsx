import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import styles from './Resultados.module.css';

export function Resultados() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [exercicio, setExercicio] = useState(null);
  const [resultados, setResultados] = useState(null);
  const [erro, setErro] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    Promise.all([api.getExercicio(id, token), api.resultados(id, token)])
      .then(([ex, res]) => {
        setExercicio(ex);
        setResultados(res);
      })
      .catch((err) => setErro(err.message));
  }, [id, token]);

  async function excluir() {
    const confirmado = window.confirm(
      'Excluir este exercício? Ele some para todos os alunos atribuídos e essa ação não pode ser desfeita.'
    );
    if (!confirmado) return;
    setExcluindo(true);
    try {
      await api.excluirExercicio(id, token);
      navigate('/professor/exercicios');
    } catch (err) {
      setErro(err.message);
      setExcluindo(false);
    }
  }

  return (
    <div className={styles.pagina}>
      <Link to="/professor/exercicios" className={styles.voltar}>
        ← Meus exercícios
      </Link>

      {erro && (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      )}
      {exercicio && (
        <>
          <div className={styles.cabecalho}>
            <div>
              <h1>{exercicio.titulo}</h1>
              <p className={styles.subtitulo}>{exercicio.questoes.length} questão(ões)</p>
            </div>
            <div className={styles.acoes}>
              <Link to={`/professor/${id}/editar`} className={styles.botaoSecundario}>
                Editar
              </Link>
              <button className={styles.botaoExcluir} onClick={excluir} disabled={excluindo}>
                {excluindo ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
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
