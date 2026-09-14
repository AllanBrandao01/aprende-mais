import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { arquivoParaBase64 } from '../../lib/midia';
import { SelecionarAlunosModal } from '../../components/SelecionarAlunosModal';
import styles from './CriarExercicio.module.css';

const NOME_TIPO_QUESTAO = { multipla_escolha: 'Múltipla escolha', dissertativa: 'Dissertativa' };

function questaoVazia() {
  return {
    tipo: 'multipla_escolha',
    enunciado: '',
    midia_url: '',
    midia_tipo: 'imagem',
    alternativas: [{ texto: '', correta: true }, { texto: '', correta: false }],
  };
}

// valida no navegador antes de enviar — sem isso, um campo obrigatório vazio
// dentro de uma questão recolhida (accordion) travaria o envio sem nenhum
// aviso visível, já que o campo com erro nem aparece na tela
function validarQuestoes(questoes) {
  for (const [i, q] of questoes.entries()) {
    if (!q.enunciado.trim()) return { indice: i, mensagem: `Questão ${i + 1}: preencha o enunciado.` };
    if (q.tipo === 'dissertativa') continue;
    if (q.alternativas.length < 2 || q.alternativas.some((a) => !a.texto.trim())) {
      return { indice: i, mensagem: `Questão ${i + 1}: preencha todas as alternativas.` };
    }
    if (!q.alternativas.some((a) => a.correta)) {
      return { indice: i, mensagem: `Questão ${i + 1}: marque a alternativa correta.` };
    }
  }
  return null;
}

function CampoMidia({ titulo, placeholder, url, tipo, onUrlChange, onTipoChange }) {
  const inputArquivoRef = useRef(null);
  const isArquivo = url.startsWith('data:');

  async function selecionarArquivo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    onUrlChange(await arquivoParaBase64(file));
    onTipoChange('imagem');
  }

  return (
    <div className={styles.campoMidia}>
      <label>{titulo}</label>
      <div className={styles.mediaLinha}>
        {isArquivo ? (
          <span className={styles.mediaCarregada}>Imagem enviada do computador</span>
        ) : (
          <input
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder={placeholder}
            className={styles.mediaInput}
          />
        )}
        <button
          type="button"
          className={styles.botaoAnexo}
          onClick={() => inputArquivoRef.current?.click()}
          aria-label="Enviar imagem do computador"
          title="Enviar imagem do computador"
        >
          🖼️
        </button>
        <input
          ref={inputArquivoRef}
          type="file"
          accept="image/*"
          onChange={selecionarArquivo}
          className={styles.inputArquivoOculto}
          tabIndex={-1}
        />
      </div>

      {url && (
        <div className={styles.previewLinha}>
          {tipo === 'imagem' ? (
            <img src={url} alt="Pré-visualização da mídia" className={styles.preview} />
          ) : (
            <span className={styles.dica}>Vídeo do YouTube configurado.</span>
          )}
          <div className={styles.previewAcoes}>
            {!isArquivo && (
              <label className={styles.tipoInline}>
                Tipo
                <select value={tipo} onChange={(e) => onTipoChange(e.target.value)}>
                  <option value="imagem">Imagem</option>
                  <option value="video">Vídeo (YouTube)</option>
                </select>
              </label>
            )}
            <button type="button" className={styles.linkBotaoRemover} onClick={() => onUrlChange('')}>
              remover mídia
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CriarExercicio() {
  const { id } = useParams();
  const edicao = Boolean(id);
  const { token } = useAuth();
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState('');
  const [disciplina, setDisciplina] = useState('portugues');
  const [serie, setSerie] = useState('');
  const [midiaUrl, setMidiaUrl] = useState('');
  const [midiaTipo, setMidiaTipo] = useState('imagem');
  const [questoes, setQuestoes] = useState([questaoVazia()]);
  const [questaoAberta, setQuestaoAberta] = useState(0);
  const [alunos, setAlunos] = useState(null);
  const [alunoIds, setAlunoIds] = useState([]);
  const [modalAlunosAberto, setModalAlunosAberto] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(edicao);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api
      .listAlunos(token)
      .then(setAlunos)
      .catch((err) => setErro(err.message));
  }, [token]);

  useEffect(() => {
    if (!edicao) return;
    api
      .getExercicio(id, token)
      .then((ex) => {
        setTitulo(ex.titulo);
        setDisciplina(ex.disciplina);
        setSerie(ex.serie || '');
        setMidiaUrl(ex.midia_url || '');
        setMidiaTipo(ex.midia_tipo || 'imagem');
        setQuestoes(
          ex.questoes.map((q) => ({
            tipo: q.tipo || 'multipla_escolha',
            enunciado: q.enunciado,
            midia_url: q.midia_url || '',
            midia_tipo: q.midia_tipo || 'imagem',
            alternativas: q.alternativas.map((a) => ({ texto: a.texto, correta: a.correta })),
          }))
        );
        setQuestaoAberta(null);
        setAlunoIds(ex.alunos.map((a) => a.id));
      })
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false));
  }, [edicao, id, token]);

  function atualizarQuestao(i, campo, valor) {
    setQuestoes((qs) => qs.map((q, idx) => (idx === i ? { ...q, [campo]: valor } : q)));
  }

  function atualizarAlternativa(qi, ai, texto) {
    setQuestoes((qs) =>
      qs.map((q, idx) =>
        idx !== qi ? q : { ...q, alternativas: q.alternativas.map((a, j) => (j === ai ? { ...a, texto } : a)) }
      )
    );
  }

  function marcarCorreta(qi, ai) {
    setQuestoes((qs) =>
      qs.map((q, idx) =>
        idx !== qi ? q : { ...q, alternativas: q.alternativas.map((a, j) => ({ ...a, correta: j === ai })) }
      )
    );
  }

  function adicionarAlternativa(qi) {
    setQuestoes((qs) =>
      qs.map((q, idx) => (idx !== qi ? q : { ...q, alternativas: [...q.alternativas, { texto: '', correta: false }] }))
    );
  }

  function adicionarQuestao() {
    setQuestoes((qs) => [...qs, questaoVazia()]);
    setQuestaoAberta(questoes.length);
  }

  function removerQuestao(i) {
    setQuestoes((qs) => qs.filter((_, idx) => idx !== i));
    setQuestaoAberta(null);
  }

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (alunoIds.length === 0) {
      setErro('Selecione ao menos um aluno para receber o exercício.');
      return;
    }
    const invalida = validarQuestoes(questoes);
    if (invalida) {
      setQuestaoAberta(invalida.indice);
      setErro(invalida.mensagem);
      return;
    }
    setSalvando(true);
    try {
      const payload = {
        titulo,
        disciplina,
        serie,
        midia_url: midiaUrl,
        midia_tipo: midiaTipo,
        questoes,
        aluno_ids: alunoIds,
      };
      const exercicio = edicao ? await api.atualizarExercicio(id, payload, token) : await api.criarExercicio(payload, token);
      navigate(`/professor/${exercicio.id}/resultados`);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <p className={styles.pagina}>Carregando...</p>;

  return (
    <div className={styles.pagina}>
      <h1>{edicao ? 'Editar exercício' : 'Novo exercício'}</h1>
      <form onSubmit={enviar} className={styles.form}>
        <label>
          Título
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </label>

        <div className={styles.linha}>
          <label>
            Disciplina
            <select value={disciplina} onChange={(e) => setDisciplina(e.target.value)}>
              <option value="portugues">Português</option>
              <option value="matematica">Matemática</option>
            </select>
          </label>
          <label>
            Série
            <input value={serie} onChange={(e) => setSerie(e.target.value)} placeholder="ex: 5 ano" />
          </label>
        </div>

        <CampoMidia
          titulo="Mídia principal do exercício (opcional)"
          placeholder="https://... (ex: 1 vídeo com várias questões)"
          url={midiaUrl}
          tipo={midiaTipo}
          onUrlChange={setMidiaUrl}
          onTipoChange={setMidiaTipo}
        />

        <div className={styles.questao}>
          <div className={styles.blocoTopo}>
            <strong>Direcionar para</strong>
            <button type="button" className={styles.linkBotao} onClick={() => setModalAlunosAberto(true)}>
              {alunoIds.length === 0 ? '+ Selecionar alunos' : 'Editar seleção'}
            </button>
          </div>
          {alunos === null && <p className={styles.dica}>Carregando alunos...</p>}
          {alunos?.length === 0 && <p className={styles.dica}>Nenhum aluno cadastrado ainda.</p>}
          {alunoIds.length === 0 && alunos?.length > 0 && (
            <p className={styles.dica}>Nenhum aluno selecionado ainda.</p>
          )}
          {alunoIds.length > 0 && (
            <div className={styles.chips}>
              {alunoIds.map((alunoId) => {
                const aluno = alunos?.find((a) => a.id === alunoId);
                if (!aluno) return null;
                return (
                  <span className={styles.chip} key={alunoId}>
                    {aluno.nome}
                    <button
                      type="button"
                      onClick={() => setAlunoIds((ids) => ids.filter((x) => x !== alunoId))}
                      aria-label={`Remover ${aluno.nome} da seleção`}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {questoes.map((questao, qi) =>
          questaoAberta === qi ? (
            <fieldset className={styles.questao} key={qi}>
              <legend>Questão {qi + 1}</legend>

              <label>
                Tipo de questão
                <select value={questao.tipo} onChange={(e) => atualizarQuestao(qi, 'tipo', e.target.value)}>
                  <option value="multipla_escolha">Múltipla escolha</option>
                  <option value="dissertativa">Dissertativa (resposta livre)</option>
                </select>
              </label>

              <label>
                Enunciado
                <input value={questao.enunciado} onChange={(e) => atualizarQuestao(qi, 'enunciado', e.target.value)} />
              </label>

              <CampoMidia
                titulo="Imagem ou vídeo desta questão (opcional)"
                placeholder="https://..."
                url={questao.midia_url}
                tipo={questao.midia_tipo}
                onUrlChange={(v) => atualizarQuestao(qi, 'midia_url', v)}
                onTipoChange={(v) => atualizarQuestao(qi, 'midia_tipo', v)}
              />

              {questao.tipo === 'dissertativa' ? (
                <p className={styles.dica}>
                  O aluno vai responder com um texto livre. Essa resposta não entra no cálculo de % de acerto — ela
                  fica disponível para você ler na tela de revisão do aluno.
                </p>
              ) : (
                <>
                  <p className={styles.dica}>Marque a alternativa correta:</p>
                  {questao.alternativas.map((alt, ai) => (
                    <div className={styles.alternativa} key={ai}>
                      <label className={styles.radioAlvo}>
                        <input
                          type="radio"
                          name={`correta-${qi}`}
                          checked={alt.correta}
                          onChange={() => marcarCorreta(qi, ai)}
                          aria-label={`Marcar alternativa ${ai + 1} da questão ${qi + 1} como correta`}
                        />
                      </label>
                      <input
                        value={alt.texto}
                        onChange={(e) => atualizarAlternativa(qi, ai, e.target.value)}
                        placeholder={`Alternativa ${ai + 1}`}
                        aria-label={`Texto da alternativa ${ai + 1} da questão ${qi + 1}`}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className={styles.linkBotao}
                    onClick={() => adicionarAlternativa(qi)}
                    aria-label={`Adicionar alternativa à questão ${qi + 1}`}
                  >
                    + alternativa
                  </button>
                </>
              )}

              <div className={styles.blocoTopo}>
                <button type="button" className={styles.linkBotao} onClick={() => setQuestaoAberta(null)}>
                  recolher
                </button>
                {questoes.length > 1 && (
                  <button
                    type="button"
                    className={styles.linkBotaoRemover}
                    onClick={() => removerQuestao(qi)}
                    aria-label={`Remover questão ${qi + 1}`}
                  >
                    remover questão
                  </button>
                )}
              </div>
            </fieldset>
          ) : (
            <div className={styles.questaoResumo} key={qi}>
              <button type="button" className={styles.questaoResumoBotao} onClick={() => setQuestaoAberta(qi)}>
                <strong>Questão {qi + 1}</strong>
                <span className={styles.dica}>
                  {NOME_TIPO_QUESTAO[questao.tipo]}
                  {questao.enunciado ? ` — ${questao.enunciado}` : ' — (sem enunciado ainda)'}
                </span>
              </button>
              {questoes.length > 1 && (
                <button
                  type="button"
                  className={styles.linkBotaoRemover}
                  onClick={() => removerQuestao(qi)}
                  aria-label={`Remover questão ${qi + 1}`}
                >
                  remover
                </button>
              )}
            </div>
          )
        )}

        <button type="button" className={styles.botaoSecundario} onClick={adicionarQuestao}>
          + adicionar questão
        </button>

        {edicao && (
          <p className={styles.dica}>
            Salvar substitui as questões atuais — os alunos ficam todos com a mesma versão nova do exercício, e
            respostas já dadas para as questões antigas são apagadas.
          </p>
        )}

        {erro && (
          <p className={styles.erro} role="alert">
            {erro}
          </p>
        )}

        <div className={styles.linha}>
          <button type="submit" className={styles.botaoPrincipal} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar exercício'}
          </button>
          <Link to={edicao ? `/professor/${id}/resultados` : '/professor/exercicios'} className={styles.botaoCancelar}>
            Cancelar
          </Link>
        </div>
      </form>

      <SelecionarAlunosModal
        aberto={modalAlunosAberto}
        alunos={alunos}
        selecionados={alunoIds}
        onConfirmar={(ids) => {
          setAlunoIds(ids);
          setModalAlunosAberto(false);
        }}
        onFechar={() => setModalAlunosAberto(false)}
      />
    </div>
  );
}
