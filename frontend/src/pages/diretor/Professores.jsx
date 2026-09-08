import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import styles from '../professor/Alunos.module.css';

export function Professores() {
  const { token } = useAuth();
  const [professores, setProfessores] = useState(null);
  const [erro, setErro] = useState('');
  const [resetado, setResetado] = useState(null);
  const [resetandoId, setResetandoId] = useState(null);

  useEffect(() => {
    api
      .listProfessores(token)
      .then(setProfessores)
      .catch((err) => setErro(err.message));
  }, [token]);

  async function resetarSenha(prof) {
    const confirmado = window.confirm(
      `Resetar a senha de ${prof.nome}? Ele(a) vai precisar trocar por uma nova no próximo login.`
    );
    if (!confirmado) return;
    setResetandoId(prof.id);
    setErro('');
    try {
      const { senhaPadrao } = await api.resetarSenhaProfessor(prof.id, token);
      setResetado({ nome: prof.nome, senhaPadrao });
    } catch (err) {
      setErro(err.message);
    } finally {
      setResetandoId(null);
    }
  }

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
      {resetado && (
        <p className={styles.sucesso} role="status">
          Senha de <strong>{resetado.nome}</strong> resetada para <strong>{resetado.senhaPadrao}</strong>. Informe a
          ele(a) — vai precisar trocar no próximo login.
        </p>
      )}
      {professores?.length === 0 && <p>Nenhum professor cadastrado ainda.</p>}

      <div className={styles.lista}>
        {professores?.map((prof) => (
          <div className={styles.cartao} key={prof.id}>
            <div>
              <strong>{prof.nome}</strong>
              {prof.email && <span className={styles.turma}> — {prof.email}</span>}
            </div>
            <button
              type="button"
              className={styles.botaoResetar}
              onClick={() => resetarSenha(prof)}
              disabled={resetandoId === prof.id}
            >
              {resetandoId === prof.id ? 'Resetando...' : 'Resetar senha'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
