import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import styles from './EvolucaoAluno.module.css';

export function EvolucaoAluno() {
  const { id } = useParams();
  const { token } = useAuth();
  const [alunos, setAlunos] = useState(null);
  const [evolucao, setEvolucao] = useState(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  function carregar() {
    Promise.all([api.listAlunos(token), api.evolucaoAluno(id, token)])
      .then(([lista, ev]) => {
        setAlunos(lista);
        setEvolucao(ev);
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
              {aluno.situacao === 'apto_saida' ? 'Apto a sair do reforço' : 'Em reforço'}
            </span>
            <button className={styles.botaoSecundario} onClick={alternarSituacao} disabled={salvando}>
              {aluno.situacao === 'apto_saida' ? 'Voltar para reforço' : 'Marcar como apto a sair'}
            </button>
          </div>
        </>
      )}

      <h2>Evolução</h2>
      {evolucao?.length === 0 && <p>Esse aluno ainda não respondeu nenhum exercício.</p>}
      <div className={styles.lista}>
        {evolucao?.map((r) => (
          <div className={styles.linha} key={r.exercicio_id}>
            <div className={styles.linhaTopo}>
              <strong>{r.exercicio_titulo}</strong>
              <span>{r.percentual}%</span>
            </div>
            <div className={styles.barraFundo}>
              <div className={styles.barraPreenchida} style={{ width: `${r.percentual}%` }} />
            </div>
            <span className={styles.detalhe}>
              {r.acertos}/{r.total_respondidas} acertos — {new Date(r.exercicio_criado_em).toLocaleDateString('pt-BR')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
