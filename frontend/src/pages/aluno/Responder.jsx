import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { falar, youtubeEmbedUrl } from '../../lib/midia';
import styles from './Responder.module.css';

function Midia({ url, tipo, legenda }) {
  if (!url) return null;
  if (tipo === 'video' && youtubeEmbedUrl(url)) {
    return (
      <iframe
        className={styles.midiaVideo}
        src={youtubeEmbedUrl(url)}
        title={legenda}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return <img className={styles.midiaImagem} src={url} alt={legenda} />;
}

export function Responder() {
  const { id } = useParams();
  const { token } = useAuth();
  const [exercicio, setExercicio] = useState(null);
  const [indice, setIndice] = useState(0);
  const [selecionada, setSelecionada] = useState(null);
  const [textoResposta, setTextoResposta] = useState('');
  // 'certa' | 'errada' | 'registrada' | null
  const [feedback, setFeedback] = useState(null);
  const [acertos, setAcertos] = useState(0);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    Promise.all([api.getExercicio(id, token), api.respostasExercicio(id, null, token)])
      .then(([ex, respostas]) => {
        setExercicio(ex);
        const porQuestao = {};
        respostas.forEach((r) => {
          porQuestao[r.questao_id] = r;
        });
        // pula direto para a primeira questão ainda não respondida, somando os
        // acertos já registrados — cobre tanto retomar um exercício interrompido
        // quanto abrir de novo um já concluído (nesse caso cai direto no final)
        let acumulado = 0;
        let primeiraPendente = ex.questoes.length;
        ex.questoes.forEach((q, i) => {
          const r = porQuestao[q.id];
          if (r) {
            if (r.correta) acumulado += 1;
          } else if (primeiraPendente === ex.questoes.length) {
            primeiraPendente = i;
          }
        });
        setAcertos(acumulado);
        setIndice(primeiraPendente);
      })
      .catch((err) => setErro(err.message));
  }, [id, token]);

  if (erro)
    return (
      <p className={styles.erro} role="alert">
        {erro}
      </p>
    );
  if (!exercicio) return <p className={styles.pagina}>Carregando...</p>;

  const questao = exercicio.questoes[indice];
  const finalizado = indice >= exercicio.questoes.length;
  const totalObjetivas = exercicio.questoes.filter((q) => q.tipo !== 'dissertativa').length;

  async function escolher(alternativaId) {
    setSelecionada(alternativaId);
    setEnviando(true);
    try {
      const resposta = await api.responder(id, { questao_id: questao.id, alternativa_id: alternativaId }, token);
      setFeedback(resposta.correta ? 'certa' : 'errada');
      if (resposta.correta) setAcertos((a) => a + 1);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function enviarDissertativa(e) {
    e.preventDefault();
    if (!textoResposta.trim() || enviando) return;
    setEnviando(true);
    try {
      await api.responder(id, { questao_id: questao.id, resposta_texto: textoResposta.trim() }, token);
      setFeedback('registrada');
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  function proxima() {
    setIndice((i) => i + 1);
    setSelecionada(null);
    setTextoResposta('');
    setFeedback(null);
  }

  if (finalizado) {
    return (
      <div className={styles.pagina}>
        <h1>Concluído!</h1>
        <p className={styles.resumo}>
          {totalObjetivas > 0
            ? `Você acertou ${acertos} de ${totalObjetivas} questões.`
            : 'Suas respostas foram registradas.'}
        </p>
        <Link to="/aluno" className={styles.botaoPrincipal}>
          Voltar aos exercícios
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.pagina}>
      <Link to="/aluno" className={styles.voltar}>
        ← Voltar aos exercícios
      </Link>
      <p className={styles.progresso}>
        Questão {indice + 1} de {exercicio.questoes.length}
      </p>

      <Midia url={exercicio.midia_url} tipo={exercicio.midia_tipo} legenda="Mídia de apoio do exercício" />

      <div className={styles.enunciadoLinha}>
        <h1>{questao.enunciado}</h1>
        <button
          type="button"
          className={styles.botaoOuvir}
          onClick={() =>
            falar(
              questao.tipo === 'dissertativa'
                ? questao.enunciado
                : `${questao.enunciado}. ${questao.alternativas.map((a) => a.texto).join('. ')}`
            )
          }
          aria-label="Ouvir a questão em voz alta"
        >
          🔊 Ouvir
        </button>
      </div>

      <Midia url={questao.midia_url} tipo={questao.midia_tipo} legenda="Imagem de apoio da questão" />

      {questao.tipo === 'dissertativa' ? (
        <form onSubmit={enviarDissertativa}>
          <textarea
            className={styles.textoResposta}
            value={textoResposta}
            onChange={(e) => setTextoResposta(e.target.value)}
            disabled={feedback !== null || enviando}
            placeholder="Escreva sua resposta aqui..."
            rows={5}
          />
          {feedback === null && (
            <button type="submit" className={styles.botaoPrincipal} disabled={enviando || !textoResposta.trim()}>
              Enviar resposta
            </button>
          )}
        </form>
      ) : (
        <div className={styles.alternativas}>
          {questao.alternativas.map((alt) => {
            const escolhida = selecionada === alt.id;
            let classe = styles.alternativa;
            if (feedback !== null && escolhida) classe += feedback === 'certa' ? ` ${styles.certa}` : ` ${styles.errada}`;
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
      )}

      {feedback !== null && (
        <>
          <p
            className={feedback === 'errada' ? styles.errada : styles.certa}
            role="status"
            aria-live="polite"
          >
            {feedback === 'certa' ? 'Certo!' : feedback === 'errada' ? 'Não foi dessa vez.' : 'Resposta registrada.'}
          </p>
          <button className={styles.botaoPrincipal} onClick={proxima}>
            {indice + 1 < exercicio.questoes.length ? 'Próxima questão' : 'Ver resultado'}
          </button>
        </>
      )}
    </div>
  );
}
