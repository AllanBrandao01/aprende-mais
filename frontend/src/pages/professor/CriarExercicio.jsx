import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import styles from './CriarExercicio.module.css';

function questaoVazia() {
  return { enunciado: '', alternativas: [{ texto: '', correta: true }, { texto: '', correta: false }] };
}

export function CriarExercicio() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState('');
  const [disciplina, setDisciplina] = useState('portugues');
  const [serie, setSerie] = useState('');
  const [questoes, setQuestoes] = useState([questaoVazia()]);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  function atualizarQuestao(i, enunciado) {
    setQuestoes((qs) => qs.map((q, idx) => (idx === i ? { ...q, enunciado } : q)));
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

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const exercicio = await api.criarExercicio({ titulo, disciplina, serie, questoes }, token);
      navigate(`/professor/${exercicio.id}/resultados`);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={styles.pagina}>
      <h1>Novo exercício</h1>
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

        {questoes.map((questao, qi) => (
          <fieldset className={styles.questao} key={qi}>
            <legend>Questão {qi + 1}</legend>

            <label>
              Enunciado
              <input value={questao.enunciado} onChange={(e) => atualizarQuestao(qi, e.target.value)} required />
            </label>

            <p className={styles.dica}>Marque a alternativa correta:</p>
            {questao.alternativas.map((alt, ai) => (
              <div className={styles.alternativa} key={ai}>
                <input
                  type="radio"
                  name={`correta-${qi}`}
                  checked={alt.correta}
                  onChange={() => marcarCorreta(qi, ai)}
                />
                <input
                  value={alt.texto}
                  onChange={(e) => atualizarAlternativa(qi, ai, e.target.value)}
                  placeholder={`Alternativa ${ai + 1}`}
                  required
                />
              </div>
            ))}
            <button type="button" className={styles.linkBotao} onClick={() => adicionarAlternativa(qi)}>
              + alternativa
            </button>

            {questoes.length > 1 && (
              <button type="button" className={styles.linkBotaoRemover} onClick={() => removerQuestao(qi)}>
                remover questão
              </button>
            )}
          </fieldset>
        ))}

        <button type="button" className={styles.botaoSecundario} onClick={adicionarQuestao}>
          + adicionar questão
        </button>

        {erro && <p className={styles.erro}>{erro}</p>}

        <button type="submit" className={styles.botaoPrincipal} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar exercício'}
        </button>
      </form>
    </div>
  );
}
