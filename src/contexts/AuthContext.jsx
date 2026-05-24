import { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mrj_painel_usuario'));
    } catch {
      return null;
    }
  });

  async function login(email, senha) {
    const { data } = await api.post('/auth/login', { email, senha });
    localStorage.setItem('mrj_painel_token', data.token);
    localStorage.setItem('mrj_painel_usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
  }

  function atualizarUsuario(dados) {
    const proximo = { ...usuario, ...dados };
    localStorage.setItem('mrj_painel_usuario', JSON.stringify(proximo));
    setUsuario(proximo);
  }

  function logout() {
    localStorage.removeItem('mrj_painel_token');
    localStorage.removeItem('mrj_painel_usuario');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
