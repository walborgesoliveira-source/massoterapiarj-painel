import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', senha: '' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await login(form.email, form.senha);
      navigate('/painel/');
    } catch {
      setErro('E-mail ou senha invalidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="brand-mark">MRJ</div>
        <h1>Massoterapia RJ</h1>
        <p>Agenda operacional da equipe</p>

        {erro && <div className="alert error">{erro}</div>}

        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </label>

        <label className="field">
          <span>Senha</span>
          <input
            type="password"
            required
            value={form.senha}
            onChange={(event) => setForm((current) => ({ ...current, senha: event.target.value }))}
          />
        </label>

        <button className="primary full" type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
