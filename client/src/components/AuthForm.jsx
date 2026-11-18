import { useState } from 'react';
import { api } from '../api.js';

export default function AuthForm({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' o 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const isLogin = mode === 'login';

  async function handleSubmit(e) {
    e.preventDefault(); // evita que el navegador recargue la página
    setError('');
    setSending(true);

    try {
      const data = isLogin
        ? await api.login(username, password)
        : await api.register(username, password);
      onLogin(data.user); // le avisa al componente padre quién entró
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  function toggleMode() {
    setMode(isLogin ? 'register' : 'login');
    setError('');
  }

  return (
    <div className="center">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>TCG Tracker</h1>
        <h2>{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</h2>

        <label>
          Usuario
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            required
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={sending}>
          {sending ? 'Enviando...' : isLogin ? 'Entrar' : 'Registrarme'}
        </button>

        <button type="button" className="link" onClick={toggleMode}>
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </form>
    </div>
  );
}