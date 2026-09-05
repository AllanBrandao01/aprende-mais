import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PreferenciasProvider } from './context/PreferenciasContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { ExerciciosListProfessor } from './pages/professor/ExerciciosList';
import { CriarExercicio } from './pages/professor/CriarExercicio';
import { Resultados } from './pages/professor/Resultados';
import { Alunos } from './pages/professor/Alunos';
import { EvolucaoAluno } from './pages/professor/EvolucaoAluno';
import { ExerciciosListAluno } from './pages/aluno/ExerciciosList';
import { Responder } from './pages/aluno/Responder';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PreferenciasProvider>
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
              <Route path="/professor/alunos" element={<Alunos />} />
              <Route path="/professor/alunos/:id" element={<EvolucaoAluno />} />
              <Route path="/aluno" element={<ExerciciosListAluno />} />
              <Route path="/aluno/:id" element={<Responder />} />
            </Route>
          </Routes>
        </PreferenciasProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
