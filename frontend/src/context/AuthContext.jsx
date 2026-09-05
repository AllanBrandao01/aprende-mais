import { createContext, useContext, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem('aprendemais.session');
    return raw ? JSON.parse(raw) : null;
  });

  function persist(next) {
    setSession(next);
    if (next) localStorage.setItem('aprendemais.session', JSON.stringify(next));
    else localStorage.removeItem('aprendemais.session');
  }

  async function login(credenciais) {
    const data = await api.login(credenciais);
    persist({ token: data.access_token, user: data.user });
  }

  function logout() {
    persist(null);
  }

  function atualizarUsuario(patch) {
    persist({ ...session, user: { ...session.user, ...patch } });
  }

  return (
    <AuthContext.Provider
      value={{ user: session?.user, token: session?.token, login, logout, atualizarUsuario }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
