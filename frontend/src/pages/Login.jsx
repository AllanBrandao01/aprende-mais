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
  const [mensagem] = useState(() => {
    const guardada = sessionStorage.getItem('aprendemais.mensagemLogin');
    if (guardada) sessionStorage.removeItem('aprendemais.mensagemLogin');
    return guardada;
  });

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      if (tipo === 'aluno') {
        await login({ usuario, password });
      } else {
        await login({ email, password });
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

        {mensagem && (
          <p className={styles.mensagemSucesso} role="status">
            {mensagem}
          </p>
        )}

        <label>
          Sou
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="aluno">Aluno</option>
            <option value="professor">Professor</option>
            <option value="diretor">Diretor</option>
          </select>
        </label>

        {tipo !== 'aluno' ? (
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
