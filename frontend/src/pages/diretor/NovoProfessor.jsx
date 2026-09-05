import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import styles from '../professor/CriarExercicio.module.css';

export function NovoProfessor() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [criado, setCriado] = useState(null);

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const professor = await api.criarProfessor({ nome, email }, token);
      setCriado(professor);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  if (criado) {
    return (
      <div className={styles.pagina}>
        <h1>Professor cadastrado!</h1>
        <p className={styles.dica}>
          Informe ao(à) professor(a) <strong>{criado.email}</strong> a senha padrão abaixo. Ele(a) será obrigado(a) a
          trocá-la no primeiro acesso.
        </p>
        <p className={styles.dica}>
          Senha padrão: <strong>{criado.senhaPadrao}</strong>
        </p>
        <Link to="/diretor" className={styles.botaoPrincipal}>
          Voltar para Professores
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.pagina}>
      <h1>Novo professor</h1>
      <form onSubmit={enviar} className={styles.form}>
        <label>
          Nome completo
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </label>

        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <p className={styles.dica}>
          A conta será criada com uma senha padrão. O professor deverá trocá-la no primeiro acesso.
        </p>

        {erro && (
          <p className={styles.erro} role="alert">
            {erro}
          </p>
        )}

        <div className={styles.linha}>
          <button type="submit" className={styles.botaoPrincipal} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Cadastrar professor'}
          </button>
          <Link to="/diretor" className={styles.botaoCancelar}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
