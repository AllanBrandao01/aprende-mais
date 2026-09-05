import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

export function Login() {
  const [modo, setModo] = useState('login');
  const [form, setForm] = useState({ email: '', usuario: '', password: '', nome: '', tipo: 'aluno', turma: '' });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  function atualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function mudarModo(novoModo) {
    setModo(novoModo);
    if (novoModo === 'cadastro') atualizar('tipo', 'aluno');
  }

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      if (modo === 'login') {
        if (form.tipo === 'professor') {
          await login({ email: form.email, password: form.password });
        } else {
          await login({ usuario: form.usuario, password: form.password });
        }
        navigate('/');
      } else {
        await register(form);
        setModo('login');
        setErro('Cadastro criado! Faça login.');
      }
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

        <div className={styles.tabs} role="tablist" aria-label="Entrar ou criar conta">
          <button
            type="button"
            role="tab"
            aria-selected={modo === 'login'}
            className={modo === 'login' ? styles.ativo : ''}
            onClick={() => mudarModo('login')}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={modo === 'cadastro'}
            className={modo === 'cadastro' ? styles.ativo : ''}
            onClick={() => mudarModo('cadastro')}
          >
            Criar conta
          </button>
        </div>

        {modo === 'login' ? (
          <label>
            Sou
            <select value={form.tipo} onChange={(e) => atualizar('tipo', e.target.value)}>
              <option value="aluno">Aluno</option>
              <option value="professor">Professor</option>
            </select>
          </label>
        ) : (
          <p className={styles.subtitulo}>Cadastro de aluno. Contas de professor são criadas pela escola.</p>
        )}

        {modo === 'cadastro' && (
          <label>
            Nome completo
            <input value={form.nome} onChange={(e) => atualizar('nome', e.target.value)} required />
          </label>
        )}

        {form.tipo === 'professor' ? (
          <label>
            E-mail
            <input type="email" value={form.email} onChange={(e) => atualizar('email', e.target.value)} required />
          </label>
        ) : (
          <label>
            Nome de usuário
            <input value={form.usuario} onChange={(e) => atualizar('usuario', e.target.value)} required />
          </label>
        )}

        <label>
          Senha
          <input
            type="password"
            value={form.password}
            onChange={(e) => atualizar('password', e.target.value)}
            minLength={6}
            required
          />
        </label>

        {modo === 'cadastro' && (
          <label>
            Turma
            <input value={form.turma} onChange={(e) => atualizar('turma', e.target.value)} placeholder="ex: 5A" />
          </label>
        )}

        {erro && (
          <p className={styles.mensagem} role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className={styles.botaoPrincipal} disabled={carregando}>
          {carregando ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>
    </div>
  );
}
