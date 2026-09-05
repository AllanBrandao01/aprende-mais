import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import styles from './Alunos.module.css';

export function Alunos() {
  const { token } = useAuth();
  const [alunos, setAlunos] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api
      .listAlunos(token)
      .then(setAlunos)
      .catch((err) => setErro(err.message));
  }, [token]);

  return (
    <div className={styles.pagina}>
      <h1>Alunos</h1>

      {erro && (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      )}
      {alunos?.length === 0 && <p>Nenhum aluno cadastrado ainda.</p>}

      <div className={styles.lista}>
        {alunos?.map((aluno) => (
          <Link to={`/professor/alunos/${aluno.id}`} key={aluno.id} className={styles.cartao}>
            <div>
              <strong>{aluno.nome}</strong>
              {aluno.turma && <span className={styles.turma}> — {aluno.turma}</span>}
            </div>
            <span className={aluno.situacao === 'apto_saida' ? styles.badgeApto : styles.badgeReforco}>
              {aluno.situacao === 'apto_saida' ? 'Apto a sair' : 'Em reforço'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
