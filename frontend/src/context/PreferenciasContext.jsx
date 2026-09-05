import { createContext, useContext, useEffect, useState } from 'react';

const PreferenciasContext = createContext(null);

const ESCALA_MIN = 1;
const ESCALA_MAX = 1.4;
const PASSO = 0.1;

export function PreferenciasProvider({ children }) {
  const [escala, setEscala] = useState(() => Number(localStorage.getItem('aprendemais.escala')) || 1);
  const [altoContraste, setAltoContraste] = useState(() => localStorage.getItem('aprendemais.contraste') === '1');

  useEffect(() => {
    localStorage.setItem('aprendemais.escala', String(escala));
  }, [escala]);

  useEffect(() => {
    localStorage.setItem('aprendemais.contraste', altoContraste ? '1' : '0');
  }, [altoContraste]);

  function aumentarFonte() {
    setEscala((e) => Math.min(ESCALA_MAX, +(e + PASSO).toFixed(2)));
  }
  function diminuirFonte() {
    setEscala((e) => Math.max(ESCALA_MIN, +(e - PASSO).toFixed(2)));
  }
  function alternarContraste() {
    setAltoContraste((v) => !v);
  }

  return (
    <PreferenciasContext.Provider value={{ escala, altoContraste, aumentarFonte, diminuirFonte, alternarContraste }}>
      {children}
    </PreferenciasContext.Provider>
  );
}

export function usePreferencias() {
  return useContext(PreferenciasContext);
}
