import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePreferencias } from '../context/PreferenciasContext';
import styles from './Layout.module.css';

export function Layout() {
  const { user, logout } = useAuth();
  const { escala, altoContraste, aumentarFonte, diminuirFonte, alternarContraste } = usePreferencias();

  return (
    <div className={`${styles.app} ${altoContraste ? 'alto-contraste' : ''}`}>
      <a href="#conteudo" className="pular-conteudo">
        Pular para o conteúdo
      </a>
      <header className={styles.header}>
        <div className={styles.headerTopo}>
          <span>Aprende+</span>
          <div className={styles.preferencias}>
            <button onClick={diminuirFonte} aria-label="Diminuir tamanho da fonte">
              A-
            </button>
            <button onClick={aumentarFonte} aria-label="Aumentar tamanho da fonte">
              A+
            </button>
            <button onClick={alternarContraste} aria-pressed={altoContraste} aria-label="Alternar alto contraste">
              Contraste
            </button>
            <button onClick={logout}>Sair</button>
          </div>
        </div>
        {user?.tipo === 'professor' && (
          <nav className={styles.nav} aria-label="Navegação principal">
            <NavLink to="/professor" end className={({ isActive }) => (isActive ? styles.navAtivo : styles.navLink)}>
              Exercícios
            </NavLink>
            <NavLink to="/professor/alunos" className={({ isActive }) => (isActive ? styles.navAtivo : styles.navLink)}>
              Alunos
            </NavLink>
          </nav>
        )}
      </header>
      <main id="conteudo" style={{ zoom: escala }}>
        <Outlet />
      </main>
    </div>
  );
}
