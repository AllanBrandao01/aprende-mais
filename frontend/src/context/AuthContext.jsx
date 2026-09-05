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

  async function register(payload) {
    await api.register(payload);
  }

  function logout() {
    persist(null);
  }

  return (
    <AuthContext.Provider value={{ user: session?.user, token: session?.token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
