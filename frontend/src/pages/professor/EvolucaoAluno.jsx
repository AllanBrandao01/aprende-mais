import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { ConfirmModal } from '../../components/ConfirmModal';
import styles from './EvolucaoAluno.module.css';

const NOME_DISCIPLINA = { portugues: 'Português', matematica: 'Matemática' };

export function EvolucaoAluno() {
  const { id } = useParams();
  const { token } = useAuth();
  const [alunos, setAlunos] = useState(null);
  const [exercicios, setExercicios] = useState(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [resetado, setResetado] = useState(null);
  const [resetando, setResetando] = useState(false);
  const [confirmandoReset, setConfirmandoReset] = useState(false);

  function carregar() {
    Promise.all([api.listAlunos(token), api.exerciciosDoAluno(id, token)])
      .then(([lista, ex]) => {
        setAlunos(lista);
        setExercicios(ex);
      })
      .catch((err) => setErro(err.message));
  }

  useEffect(carregar, [id, token]);

  const aluno = alunos?.find((a) => a.id === id);

  async function alternarSituacao() {
    setSalvando(true);
    try {
      const novaSituacao = aluno.situacao === 'apto_saida' ? 'em_reforco' : 'apto_saida';
      await api.atualizarSituacao(id, novaSituacao, token);
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  async function resetarSenha() {
    setConfirmandoReset(false);
    setResetando(true);
    setErro('');
    try {
      const { senhaPadrao } = await api.resetarSenhaAluno(id, token);
      setResetado(senhaPadrao);
    } catch (err) {
      setErro(err.message);
    } finally {
      setResetando(false);
    }
  }

  return (
    <div className={styles.pagina}>
      <Link to="/professor/alunos" className={styles.voltar}>
        ← Alunos
      </Link>

      {erro && (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      )}

      {aluno && (
        <>
          <h1>{aluno.nome}</h1>
          <p className={styles.subtitulo}>{aluno.turma ? `Turma ${aluno.turma}` : 'Sem turma'}</p>

          <div className={styles.situacaoBox}>
            <span className={aluno.situacao === 'apto_saida' ? styles.badgeApto : styles.badgeReforco}>
              {aluno.situacao === 'apto_saida' ? 'Reforço concluído' : 'Em reforço'}
            </span>
            <button className={styles.botaoSecundario} onClick={alternarSituacao} disabled={salvando}>
              {aluno.situacao === 'apto_saida' ? 'Voltar para reforço' : 'Marcar reforço como concluído'}
            </button>
          </div>

          <div className={styles.situacaoBox}>
            <button className={styles.botaoSecundario} onClick={() => setConfirmandoReset(true)} disabled={resetando}>
              {resetando ? 'Resetando...' : 'Resetar senha do aluno'}
            </button>
            {resetado && (
              <span className={styles.badgeApto}>
                Nova senha: <strong>{resetado}</strong>
              </span>
            )}
          </div>
        </>
      )}

      <h2>Exercícios</h2>
      {exercicios?.length === 0 && <p>Nenhum exercício atribuído a esse aluno ainda.</p>}
      <div className={styles.lista}>
        {exercicios?.map((ex) => (
          <Link to={`/professor/alunos/${id}/exercicios/${ex.id}`} className={styles.linha} key={ex.id}>
            <div className={styles.linhaTopo}>
              <strong>{ex.titulo}</strong>
              <span className={ex.concluido ? styles.badgeApto : styles.badgeReforco}>
                {ex.concluido ? 'Concluído' : 'Pendente'}
              </span>
            </div>
            {ex.concluido && ex.percentual !== null && (
              <>
                <div className={styles.barraFundo}>
                  <div className={styles.barraPreenchida} style={{ width: `${ex.percentual}%` }} />
                </div>
                <span className={styles.detalhe}>
                  {ex.acertos}/{ex.total_objetivas} acertos — {new Date(ex.created_at).toLocaleDateString('pt-BR')}
                </span>
              </>
            )}
            {ex.concluido && ex.percentual === null && (
              <span className={styles.detalhe}>
                Sem questões objetivas — {new Date(ex.created_at).toLocaleDateString('pt-BR')}
              </span>
            )}
            {!ex.concluido && (
              <span className={styles.detalhe}>
                {NOME_DISCIPLINA[ex.disciplina] || ex.disciplina}
                {ex.serie ? ` — ${ex.serie}` : ''}
              </span>
            )}
          </Link>
        ))}
      </div>

      <ConfirmModal
        aberto={confirmandoReset}
        titulo="Resetar senha"
        mensagem={aluno ? `Resetar a senha de ${aluno.nome}? Ele(a) vai precisar trocar por uma nova no próximo login.` : ''}
        textoConfirmar="Resetar"
        onConfirmar={resetarSenha}
        onCancelar={() => setConfirmandoReset(false)}
      />
    </div>
  );
}
