import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { ExerciciosListProfessor } from './pages/professor/ExerciciosList';
import { CriarExercicio } from './pages/professor/CriarExercicio';
import { Resultados } from './pages/professor/Resultados';
import { ExerciciosListAluno } from './pages/aluno/ExerciciosList';
import { Responder } from './pages/aluno/Responder';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/professor" element={<ExerciciosListProfessor />} />
            <Route path="/professor/novo" element={<CriarExercicio />} />
            <Route path="/professor/:id/resultados" element={<Resultados />} />
            <Route path="/aluno" element={<ExerciciosListAluno />} />
            <Route path="/aluno/:id" element={<Responder />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
