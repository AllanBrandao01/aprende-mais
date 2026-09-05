import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, permitirSenhaTemporaria }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.senha_temporaria && !permitirSenhaTemporaria) return <Navigate to="/trocar-senha" replace />;
  return children;
}
