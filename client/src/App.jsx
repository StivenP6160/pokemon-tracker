import { useEffect, useState } from 'react';
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

  async function handleCreateMatch(match) {
    await api.createMatch(match);
    const data = await api.getMatches(); // recarga para traer los nombres de los decks
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

  async function handleCreateDeck(name) {
    const data = await api.createDeck(name);
    setDecks((prev) => [...prev, data.deck]);
    return data.deck;
  }

  async function handleLogout() {
    await api.logout();
    setUser(null);
    setDecks([]);
    setMatches([]);
  }

  if (loading) return <p className="center">Cargando...</p>;
  if (!user) return <AuthForm onLogin={setUser} />;

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

      {loadError && <p className="error">{loadError}</p>}

      <div className="layout">
        <MatchForm decks={decks} onSubmit={handleCreateMatch} onCreateDeck={handleCreateDeck} />
        <StatsPanel decks={decks} matches={matches} />
        <MatchHistory matches={matches} onDelete={handleDeleteMatch} />
      </div>
    </div>
  );
}