import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import styles from '../professor/Alunos.module.css';

export function Professores() {
  const { token } = useAuth();
  const [professores, setProfessores] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api
      .listProfessores(token)
      .then(setProfessores)
      .catch((err) => setErro(err.message));
  }, [token]);

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <h1>Professores</h1>
        <Link to="/diretor/novo" className={styles.botaoNovo}>
          + Novo professor
        </Link>
      </div>

      {erro && (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      )}
      {professores?.length === 0 && <p>Nenhum professor cadastrado ainda.</p>}

      <div className={styles.lista}>
        {professores?.map((prof) => (
          <div className={styles.cartao} key={prof.id}>
            <strong>{prof.nome}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
