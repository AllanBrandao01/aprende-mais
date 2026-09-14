import { useEffect, useMemo, useState } from 'react';
import styles from './SelecionarAlunosModal.module.css';

export function SelecionarAlunosModal({ aberto, alunos, selecionados, onConfirmar, onFechar }) {
  const [busca, setBusca] = useState('');
  const [turma, setTurma] = useState('todas');
  const [temp, setTemp] = useState(selecionados);

  useEffect(() => {
    if (aberto) {
      setTemp(selecionados);
      setBusca('');
      setTurma('todas');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    function aoTeclar(e) {
      if (e.key === 'Escape') onFechar();
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto, onFechar]);

  const turmas = useMemo(
    () => [...new Set((alunos || []).map((a) => a.turma).filter(Boolean))].sort(),
    [alunos]
  );

  const filtrados = (alunos || []).filter((a) => {
    if (turma !== 'todas' && a.turma !== turma) return false;
    if (busca.trim() && !a.nome.toLowerCase().includes(busca.trim().toLowerCase())) return false;
    return true;
  });

  function alternar(id) {
    setTemp((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  function selecionarFiltrados() {
    setTemp((ids) => [...new Set([...ids, ...filtrados.map((a) => a.id)])]);
  }

  if (!aberto) return null;

  return (
    <div className={styles.fundo} onClick={onFechar}>
      <div
        className={styles.caixa}
        role="dialog"
        aria-modal="true"
        aria-label="Selecionar alunos"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Selecionar alunos</h2>

        <div className={styles.filtros}>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome"
            aria-label="Buscar aluno por nome"
          />
          <select value={turma} onChange={(e) => setTurma(e.target.value)} aria-label="Filtrar por turma">
            <option value="todas">Todas as turmas</option>
            {turmas.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {turma !== 'todas' && filtrados.length > 0 && (
          <button type="button" className={styles.linkBotao} onClick={selecionarFiltrados}>
            Selecionar toda a turma {turma} ({filtrados.length})
          </button>
        )}

        <div className={styles.lista}>
          {filtrados.length === 0 && <p className={styles.dica}>Nenhum aluno encontrado.</p>}
          {filtrados.map((aluno) => (
            <label key={aluno.id} className={styles.item}>
              <input type="checkbox" checked={temp.includes(aluno.id)} onChange={() => alternar(aluno.id)} />
              {aluno.nome}
              {aluno.turma && <span className={styles.dica}> — {aluno.turma}</span>}
            </label>
          ))}
        </div>

        <div className={styles.rodape}>
          <span className={styles.contador}>{temp.length} selecionado(s)</span>
          <div className={styles.acoes}>
            <button type="button" className={styles.botaoCancelar} onClick={onFechar}>
              Cancelar
            </button>
            <button type="button" className={styles.botaoPrincipal} onClick={() => onConfirmar(temp)}>
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
