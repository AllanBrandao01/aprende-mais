import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import styles from './Responder.module.css';

export function Responder() {
  const { id } = useParams();
  const { token } = useAuth();
  const [exercicio, setExercicio] = useState(null);
  const [erro, setErro] = useState('');
  const [indice, setIndice] = useState(0);
  const [selecionada, setSelecionada] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [acertos, setAcertos] = useState(0);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api
      .getExercicio(id, token)
      .then(setExercicio)
      .catch((err) => setErro(err.message));
  }, [id, token]);

  if (erro) return (
    <p className={styles.erro} role="alert">
      {erro}
    </p>
  );
  if (!exercicio) return <p className={styles.pagina}>Carregando...</p>;

  const questao = exercicio.questoes[indice];
  const finalizado = indice >= exercicio.questoes.length;

  async function escolher(alternativaId) {
    setSelecionada(alternativaId);
    setEnviando(true);
    try {
      const resposta = await api.responder(id, { questao_id: questao.id, alternativa_id: alternativaId }, token);
      setFeedback(resposta.correta);
      if (resposta.correta) setAcertos((a) => a + 1);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  function proxima() {
    setIndice((i) => i + 1);
    setSelecionada(null);
    setFeedback(null);
  }

  if (finalizado) {
    return (
      <div className={styles.pagina}>
        <h1>Concluído!</h1>
        <p className={styles.resumo}>
          Você acertou {acertos} de {exercicio.questoes.length} questões.
        </p>
        <Link to="/aluno" className={styles.botaoPrincipal}>
          Voltar aos exercícios
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.pagina}>
      <p className={styles.progresso}>
        Questão {indice + 1} de {exercicio.questoes.length}
      </p>
      <h1>{questao.enunciado}</h1>

      <div className={styles.alternativas}>
        {questao.alternativas.map((alt) => {
          const escolhida = selecionada === alt.id;
          let classe = styles.alternativa;
          if (feedback !== null && escolhida) classe += feedback ? ` ${styles.certa}` : ` ${styles.errada}`;
          return (
            <button
              key={alt.id}
              className={classe}
              disabled={selecionada !== null || enviando}
              aria-pressed={escolhida}
              onClick={() => escolher(alt.id)}
            >
              {alt.texto}
            </button>
          );
        })}
      </div>

      {feedback !== null && (
        <>
          <p className={feedback ? styles.certa : styles.errada} role="status" aria-live="polite">
            {feedback ? 'Certo!' : 'Não foi dessa vez.'}
          </p>
          <button className={styles.botaoPrincipal} onClick={proxima}>
            {indice + 1 < exercicio.questoes.length ? 'Próxima questão' : 'Ver resultado'}
          </button>
        </>
      )}
    </div>
  );
}
