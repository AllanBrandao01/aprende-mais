import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { youtubeEmbedUrl } from '../../lib/midia';
import styles from './RevisaoExercicio.module.css';

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

export function RevisaoExercicio() {
  const { alunoId, exercicioId } = useParams();
  const { token } = useAuth();
  const [exercicio, setExercicio] = useState(null);
  const [respostas, setRespostas] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([api.getExercicio(exercicioId, token), api.respostasExercicio(exercicioId, alunoId, token)])
      .then(([ex, resp]) => {
        setExercicio(ex);
        setRespostas(resp);
      })
      .catch((err) => setErro(err.message));
  }, [exercicioId, alunoId, token]);

  if (erro)
    return (
      <p className={styles.erro} role="alert">
        {erro}
      </p>
    );
  if (!exercicio || !respostas) return <p className={styles.pagina}>Carregando...</p>;

  const aluno = exercicio.alunos.find((a) => a.id === alunoId);
  const porQuestao = {};
  respostas.forEach((r) => {
    porQuestao[r.questao_id] = r;
  });
  const respondeu = respostas.length > 0;
  const objetivas = exercicio.questoes.filter((q) => q.tipo !== 'dissertativa');
  const acertos = objetivas.filter((q) => porQuestao[q.id]?.correta).length;

  return (
    <div className={styles.pagina}>
      <Link to={`/professor/alunos/${alunoId}`} className={styles.voltar}>
        ← {aluno ? aluno.nome : 'Aluno'}
      </Link>

      <h1>{exercicio.titulo}</h1>
      <p className={styles.subtitulo}>
        {respondeu ? (
          objetivas.length > 0 ? (
            `${acertos}/${objetivas.length} acertos`
          ) : (
            'Sem questões objetivas'
          )
        ) : (
          'Este aluno ainda não respondeu — veja abaixo o conteúdo do exercício.'
        )}
      </p>

      <Midia url={exercicio.midia_url} tipo={exercicio.midia_tipo} legenda="Mídia de apoio do exercício" />

      <div className={styles.lista}>
        {exercicio.questoes.map((questao, i) => {
          const resposta = porQuestao[questao.id];
          return (
            <div className={styles.questao} key={questao.id}>
              <p className={styles.enunciado}>
                {i + 1}. {questao.enunciado}
              </p>
              <Midia url={questao.midia_url} tipo={questao.midia_tipo} legenda="Imagem de apoio da questão" />

              {questao.tipo === 'dissertativa' ? (
                <div className={styles.respostaTexto}>
                  {resposta?.resposta_texto || <em>Ainda não respondeu.</em>}
                </div>
              ) : (
                <div className={styles.alternativas}>
                  {questao.alternativas.map((alt) => {
                    const escolhida = resposta?.alternativa_id === alt.id;
                    let classe = styles.alternativa;
                    if (alt.correta) classe += ` ${styles.correta}`;
                    if (escolhida && !alt.correta) classe += ` ${styles.escolhidaErrada}`;
                    return (
                      <div className={classe} key={alt.id}>
                        <span>{alt.texto}</span>
                        <span className={styles.tags}>
                          {alt.correta && <span className={styles.tagCorreta}>correta</span>}
                          {escolhida && <span className={styles.tagEscolhida}>resposta do aluno</span>}
                        </span>
                      </div>
                    );
                  })}
                  {!resposta && <p className={styles.dica}>Ainda não respondeu.</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
