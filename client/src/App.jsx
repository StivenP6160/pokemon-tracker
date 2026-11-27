import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router';
import { api } from './api.js';
import AuthForm from './components/AuthForm.jsx';
import MatchForm from './components/MatchForm.jsx';
import MatchHistory from './components/MatchHistory.jsx';
import StatsPanel from './components/StatsPanel.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decks, setDecks] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loadError, setLoadError] = useState('');
  const navigate = useNavigate();

  // 1. Al abrir la página: ¿ya había una sesión iniciada?
  useEffect(() => {
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // 2. Cuando hay un usuario: carga sus decks y sus partidas
  useEffect(() => {
    if (!user) return;

    Promise.all([api.getDecks(), api.getMatches()])
      .then(([deckData, matchData]) => {
        setDecks(deckData.decks);
        setMatches(matchData.matches);
      })
      .catch((err) => setLoadError(err.message));
  }, [user]);

  // Después del login, siempre a la pantalla de estadísticas
  function handleLogin(loggedUser) {
    setUser(loggedUser);
    navigate('/');
  }

  async function handleCreateMatch({ myIcons, oppIcons, ...rest }) {
    const [mine, opp] = await Promise.all([
      api.resolveDeck(myIcons),
      api.resolveDeck(oppIcons),
    ]);

    for (const r of [mine, opp]) {
      if (r.created) {
        setDecks((prev) => (prev.some((d) => d.id === r.deck.id) ? prev : [...prev, r.deck]));
      }
    }

    await api.createMatch({ my_deck_id: mine.deck.id, opp_deck_id: opp.deck.id, ...rest });

    const data = await api.getMatches();
    setMatches(data.matches);
  }

  async function handleDeleteMatch(match) {
    const ok = window.confirm(`¿Borrar la partida ${match.my_deck} vs ${match.opp_deck}?`);
    if (!ok) return;

    try {
      await api.deleteMatch(match.id);
      setMatches((prev) => prev.filter((m) => m.id !== match.id));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleLogout() {
    await api.logout();
    setUser(null);
    setDecks([]);
    setMatches([]);
  }

  if (loading) return <p className="center">Cargando...</p>;
  if (!user) return <AuthForm onLogin={handleLogin} />;

  return (
    <div className="container">
      <header className="header">
        <h1>TCG Tracker</h1>
        <div>
          <span>
            Hola, <strong>{user.username}</strong>
          </span>
          <button className="btn-secondary" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <nav className="main-nav">
        <NavLink to="/" end>Estadísticas</NavLink>
        <NavLink to="/partidas">Partidas</NavLink>
        <NavLink to="/historial">Historial</NavLink>
      </nav>

      {loadError && <p className="error">{loadError}</p>}

      <main className="layout">
        <Routes>
          <Route path="/" element={<StatsPanel decks={decks} matches={matches} />} />
          <Route path="/partidas" element={<MatchForm decks={decks} onSubmit={handleCreateMatch} />} />
          <Route path="/historial" element={<MatchHistory matches={matches} onDelete={handleDeleteMatch} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}