import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import styles from '../professor/ExerciciosList.module.css';

const NOME_DISCIPLINA = { portugues: 'Português', matematica: 'Matemática' };

export function ExerciciosListAluno() {
  const { token } = useAuth();
  const [exercicios, setExercicios] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api
      .listExercicios(token)
      .then(setExercicios)
      .catch((err) => setErro(err.message));
  }, [token]);

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <h1>Exercícios disponíveis</h1>
      </div>

      {erro && <p className={styles.erro}>{erro}</p>}
      {exercicios === null && !erro && <p>Carregando...</p>}
      {exercicios?.length === 0 && <p>Nenhum exercício disponível ainda.</p>}

      <div className={styles.lista}>
        {exercicios?.map((ex) => (
          <Link to={`/aluno/${ex.id}`} key={ex.id} className={styles.cartao}>
            <div>
              <strong>{ex.titulo}</strong>
              <span className={styles.tag}>{NOME_DISCIPLINA[ex.disciplina]}</span>
            </div>
            {ex.serie && <p>Série: {ex.serie}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
