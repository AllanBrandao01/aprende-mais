import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.dashboardPage}>
      <header className={styles.dashboardHeader}>
        <span>Aprende+</span>
        <button onClick={logout}>Sair</button>
      </header>
      <main className={styles.dashboardContent}>
        <h1>Olá, {user.nome}!</h1>
        <p>
          Você está logado como <strong>{user.tipo}</strong>
          {user.turma ? ` — turma ${user.turma}` : ''}.
        </p>
      </main>
    </div>
  );
}
