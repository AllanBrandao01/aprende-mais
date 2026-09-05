import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

export function Layout() {
  const { logout } = useAuth();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span>Aprende+</span>
        <button onClick={logout}>Sair</button>
      </header>
      <Outlet />
    </div>
  );
}
