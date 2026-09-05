import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Home() {
  const { user } = useAuth();
  return <Navigate to={user.tipo === 'professor' ? '/professor' : '/aluno'} replace />;
}
