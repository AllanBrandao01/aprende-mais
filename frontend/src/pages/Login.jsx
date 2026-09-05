import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

export function Login() {
  const [tipo, setTipo] = useState('aluno');
  const [email, setEmail] = useState('');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      if (tipo === 'professor') {
        await login({ email, password });
      } else {
        await login({ usuario, password });
      }
      navigate('/');
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className={styles.loginPage}>
      <form className={styles.loginCard} onSubmit={enviar}>
        <h1>Aprende+</h1>
        <p className={styles.subtitulo}>Reforço escolar de Português e Matemática</p>

        <label>
          Sou
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="aluno">Aluno</option>
            <option value="professor">Professor</option>
          </select>
        </label>

        {tipo === 'professor' ? (
          <label>
            E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
        ) : (
          <label>
            Nome de usuário
            <input value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
          </label>
        )}

        <label>
          Senha
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {erro && (
          <p className={styles.mensagem} role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className={styles.botaoPrincipal} disabled={carregando}>
          {carregando ? 'Aguarde...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
