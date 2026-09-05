import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import styles from './CriarExercicio.module.css';

function questaoVazia() {
  return {
    enunciado: '',
    midia_url: '',
    midia_tipo: 'imagem',
    alternativas: [{ texto: '', correta: true }, { texto: '', correta: false }],
  };
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
  const [alunos, setAlunos] = useState(null);
  const [alunoIds, setAlunoIds] = useState([]);
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
            enunciado: q.enunciado,
            midia_url: q.midia_url || '',
            midia_tipo: q.midia_tipo || 'imagem',
            alternativas: q.alternativas.map((a) => ({ texto: a.texto, correta: a.correta })),
          }))
        );
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
  }

  function removerQuestao(i) {
    setQuestoes((qs) => qs.filter((_, idx) => idx !== i));
  }

  function alternarAluno(alunoId) {
    setAlunoIds((ids) => (ids.includes(alunoId) ? ids.filter((x) => x !== alunoId) : [...ids, alunoId]));
  }

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (alunoIds.length === 0) {
      setErro('Selecione ao menos um aluno para receber o exercício.');
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

        <div className={styles.linha}>
          <label>
            Mídia principal do exercício (link, opcional)
            <input
              value={midiaUrl}
              onChange={(e) => setMidiaUrl(e.target.value)}
              placeholder="https://... (ex: 1 vídeo com várias questões)"
            />
          </label>
          {midiaUrl && (
            <label>
              Tipo
              <select value={midiaTipo} onChange={(e) => setMidiaTipo(e.target.value)}>
                <option value="imagem">Imagem</option>
                <option value="video">Vídeo (YouTube)</option>
              </select>
            </label>
          )}
        </div>

        <fieldset className={styles.questao}>
          <legend>Direcionar para</legend>
          {alunos === null && <p className={styles.dica}>Carregando alunos...</p>}
          {alunos?.length === 0 && <p className={styles.dica}>Nenhum aluno cadastrado ainda.</p>}
          <div className={styles.listaAlunos}>
            {alunos?.map((aluno) => (
              <label key={aluno.id} className={styles.itemAluno}>
                <input
                  type="checkbox"
                  checked={alunoIds.includes(aluno.id)}
                  onChange={() => alternarAluno(aluno.id)}
                />
                {aluno.nome}
                {aluno.turma && <span className={styles.dica}> — {aluno.turma}</span>}
              </label>
            ))}
          </div>
        </fieldset>

        {questoes.map((questao, qi) => (
          <fieldset className={styles.questao} key={qi}>
            <legend>Questão {qi + 1}</legend>

            <label>
              Enunciado
              <input
                value={questao.enunciado}
                onChange={(e) => atualizarQuestao(qi, 'enunciado', e.target.value)}
                required
              />
            </label>

            <div className={styles.linha}>
              <label>
                Imagem ou vídeo desta questão (link, opcional)
                <input
                  value={questao.midia_url}
                  onChange={(e) => atualizarQuestao(qi, 'midia_url', e.target.value)}
                  placeholder="https://..."
                />
              </label>
              {questao.midia_url && (
                <label>
                  Tipo
                  <select value={questao.midia_tipo} onChange={(e) => atualizarQuestao(qi, 'midia_tipo', e.target.value)}>
                    <option value="imagem">Imagem</option>
                    <option value="video">Vídeo (YouTube)</option>
                  </select>
                </label>
              )}
            </div>

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
                  required
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
          </fieldset>
        ))}

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
    </div>
  );
}
