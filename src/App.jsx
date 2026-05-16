import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Agenda from './pages/Agenda';
import Login from './pages/Login';

function Privado({ children }) {
  const { usuario } = useAuth();
  return usuario ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Privado><Agenda /></Privado>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
