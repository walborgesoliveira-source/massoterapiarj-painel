import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Agenda from './pages/Agenda';
import Login from './pages/Login';

function Privado({ children }) {
  const { usuario } = useAuth();
  return usuario ? children : <Navigate to="/painel/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/painel/login" element={<Login />} />
      <Route path="/painel/" element={<Privado><Agenda /></Privado>} />
      <Route path="/painel/*" element={<Navigate to="/painel/" replace />} />
      <Route path="*" element={<Navigate to="/painel/" replace />} />
    </Routes>
  );
}
