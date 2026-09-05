import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import styles from './Login.module.css';

export function TrocarSenha() {
  const { token, atualizarUsuario } = useAuth();
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (novaSenha !== confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }
    setSalvando(true);
    try {
      await api.trocarSenha(novaSenha, token);
      atualizarUsuario({ senha_temporaria: false });
      navigate('/');
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={styles.loginPage}>
      <form className={styles.loginCard} onSubmit={enviar}>
        <h1>Trocar senha</h1>
        <p className={styles.subtitulo}>
          Esta conta foi criada com uma senha padrão. Defina uma nova senha para continuar.
        </p>

        <label>
          Nova senha
          <input
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            minLength={6}
            required
          />
        </label>

        <label>
          Confirmar nova senha
          <input
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            minLength={6}
            required
          />
        </label>

        {erro && (
          <p className={styles.mensagem} role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className={styles.botaoPrincipal} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Trocar senha e continuar'}
        </button>
      </form>
    </div>
  );
}
