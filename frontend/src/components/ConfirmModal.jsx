import { useEffect, useRef } from 'react';
import styles from './ConfirmModal.module.css';

export function ConfirmModal({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  perigoso = false,
  onConfirmar,
  onCancelar,
}) {
  const cancelarRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    cancelarRef.current?.focus();

    function aoTeclar(e) {
      if (e.key === 'Escape') onCancelar();
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto, onCancelar]);

  if (!aberto) return null;

  return (
    <div className={styles.fundo} onClick={onCancelar}>
      <div
        className={styles.caixa}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmModalTitulo"
        aria-describedby="confirmModalMensagem"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirmModalTitulo">{titulo}</h2>
        <p id="confirmModalMensagem">{mensagem}</p>
        <div className={styles.acoes}>
          <button ref={cancelarRef} type="button" className={styles.botaoCancelar} onClick={onCancelar}>
            {textoCancelar}
          </button>
          <button
            type="button"
            className={perigoso ? styles.botaoPerigo : styles.botaoConfirmar}
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
