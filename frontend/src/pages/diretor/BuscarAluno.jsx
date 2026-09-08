import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { ConfirmModal } from '../../components/ConfirmModal';
import styles from '../professor/Alunos.module.css';

export function BuscarAluno() {
  const { token } = useAuth();
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState(null);
  const [erro, setErro] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resetado, setResetado] = useState(null);
  const [resetandoId, setResetandoId] = useState(null);
  const [pendente, setPendente] = useState(null);

  async function buscar(e) {
    e.preventDefault();
    setErro('');
    setResetado(null);
    if (termo.trim().length < 2) {
      setErro('Digite ao menos 2 caracteres.');
      return;
    }
    setBuscando(true);
    try {
      setResultados(await api.buscarAlunos(termo.trim(), token));
    } catch (err) {
      setErro(err.message);
    } finally {
      setBuscando(false);
    }
  }

  async function resetarSenha() {
    const aluno = pendente;
    setPendente(null);
    setResetandoId(aluno.id);
    setErro('');
    try {
      const { senhaPadrao } = await api.resetarSenhaAluno(aluno.id, token);
      setResetado({ nome: aluno.nome, senhaPadrao });
    } catch (err) {
      setErro(err.message);
    } finally {
      setResetandoId(null);
    }
  }

  return (
    <div className={styles.pagina}>
      <h1>Resetar senha de aluno</h1>
      <p className={styles.turma}>
        Busque pelo nome ou nome de usuário do aluno. Use só em caso de esquecimento — o dia a dia dos alunos é
        gerenciado pelo professor.
      </p>

      <form onSubmit={buscar} className={styles.buscaForm}>
        <input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Nome ou usuário do aluno"
          aria-label="Buscar aluno"
        />
        <button type="submit" className={styles.botaoNovo} disabled={buscando}>
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

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
      {resultados?.length === 0 && <p>Nenhum aluno encontrado com esse termo.</p>}

      <div className={styles.lista}>
        {resultados?.map((aluno) => (
          <div className={styles.cartao} key={aluno.id}>
            <div>
              <strong>{aluno.nome}</strong>
              {aluno.turma && <span className={styles.turma}> — {aluno.turma}</span>}
              {aluno.usuario && <span className={styles.turma}> ({aluno.usuario})</span>}
            </div>
            <button
              type="button"
              className={styles.botaoResetar}
              onClick={() => setPendente(aluno)}
              disabled={resetandoId === aluno.id}
            >
              {resetandoId === aluno.id ? 'Resetando...' : 'Resetar senha'}
            </button>
          </div>
        ))}
      </div>

      <ConfirmModal
        aberto={pendente !== null}
        titulo="Resetar senha"
        mensagem={pendente ? `Resetar a senha de ${pendente.nome}? Ele(a) vai precisar trocar por uma nova no próximo login.` : ''}
        textoConfirmar="Resetar"
        onConfirmar={resetarSenha}
        onCancelar={() => setPendente(null)}
      />
    </div>
  );
}
