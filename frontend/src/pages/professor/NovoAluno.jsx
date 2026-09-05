import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import styles from '../professor/CriarExercicio.module.css';

export function NovoAluno() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [turma, setTurma] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await api.criarAluno({ nome, usuario, password, turma }, token);
      navigate('/professor/alunos');
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={styles.pagina}>
      <h1>Novo aluno</h1>
      <form onSubmit={enviar} className={styles.form}>
        <label>
          Nome completo
          <input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </label>

        <div className={styles.linha}>
          <label>
            Nome de usuário
            <input value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
          </label>
          <label>
            Turma
            <input value={turma} onChange={(e) => setTurma(e.target.value)} placeholder="ex: 5A" />
          </label>
        </div>

        <label>
          Senha inicial
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>

        {erro && (
          <p className={styles.erro} role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className={styles.botaoPrincipal} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Cadastrar aluno'}
        </button>
      </form>
    </div>
  );
}
