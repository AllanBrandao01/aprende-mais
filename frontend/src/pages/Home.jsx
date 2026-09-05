import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DESTINO_POR_TIPO = {
  diretor: '/diretor',
  professor: '/professor',
  aluno: '/aluno',
};

export function Home() {
  const { user } = useAuth();
  return <Navigate to={DESTINO_POR_TIPO[user.tipo] || '/aluno'} replace />;
}
