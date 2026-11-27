import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router';
import { api } from './api.js';
import AuthForm from './components/AuthForm.jsx';
import DeckSwitcher from './components/DeckSwitcher.jsx';
import MatchForm from './components/MatchForm.jsx';
import MatchHistory from './components/MatchHistory.jsx';
import StatsPanel from './components/StatsPanel.jsx';

const STORAGE_KEY = 'activeDeckId';

// Lee el deck activo guardado en el navegador (si hay)
function readSavedDeck() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? Number(value) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decks, setDecks] = useState([]);
  const [myDecks, setMyDecks] = useState([]);
  const [activeDeckId, setActiveDeckId] = useState(readSavedDeck);
  const [matches, setMatches] = useState([]);
  const [loadError, setLoadError] = useState('');
  const navigate = useNavigate();

  const activeDeck = myDecks.find((d) => d.id === activeDeckId) ?? null;

  // 1. Al abrir la página: ¿ya había una sesión iniciada?
  useEffect(() => {
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // 2. Cuando hay un usuario: carga decks, tus decks y tus partidas
  useEffect(() => {
    if (!user) return;

    Promise.all([api.getDecks(), api.getMatches(), api.getMyDecks()])
      .then(([deckData, matchData, myDeckData]) => {
        setDecks(deckData.decks);
        setMatches(matchData.matches);
        setMyDecks(myDeckData.decks);
        // Si el deck guardado no está en tu caja, usa el más reciente
        setActiveDeckId((current) =>
          myDeckData.decks.some((d) => d.id === current) ? current : myDeckData.decks[0]?.id ?? null
        );
      })
      .catch((err) => setLoadError(err.message));
  }, [user]);

  // 3. Cada vez que cambia el deck activo, lo guarda en el navegador
  useEffect(() => {
    try {
      if (activeDeckId) localStorage.setItem(STORAGE_KEY, String(activeDeckId));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Si el navegador no deja guardar, no pasa nada: solo no se recuerda
    }
  }, [activeDeckId]);

  async function refreshMyDecks() {
    const data = await api.getMyDecks();
    setMyDecks(data.decks);
    return data.decks;
  }

  function addToDeckList(deck) {
    setDecks((prev) => (prev.some((d) => d.id === deck.id) ? prev : [...prev, deck]));
  }

  // Después del login, siempre a la pantalla de estadísticas
  function handleLogin(loggedUser) {
    setUser(loggedUser);
    navigate('/');
  }

  async function handleAddDeck(icons) {
    const { deck, created } = await api.resolveDeck(icons);
    if (created) addToDeckList(deck);
    await api.addMyDeck(deck.id);
    await refreshMyDecks();
    setActiveDeckId(deck.id);
  }

  async function handleRemoveDeck(deck) {
    if (!window.confirm(`¿Quitar ${deck.name} de tus decks?`)) return;

    await api.removeMyDeck(deck.id);
    const list = await refreshMyDecks();
    if (deck.id === activeDeckId) setActiveDeckId(list[0]?.id ?? null);
  }

  async function handleCreateMatch({ myIcons, oppIcons, ...rest }) {
    const [mine, opp] = await Promise.all([
      api.resolveDeck(myIcons),
      api.resolveDeck(oppIcons),
    ]);

    for (const r of [mine, opp]) {
      if (r.created) addToDeckList(r.deck);
    }

    await api.createMatch({ my_deck_id: mine.deck.id, opp_deck_id: opp.deck.id, ...rest });

    const data = await api.getMatches();
    setMatches(data.matches);
    await refreshMyDecks(); // actualiza el conteo de partidas de tus decks
  }

  async function handleDeleteMatch(match) {
    const ok = window.confirm(`¿Borrar la partida ${match.my_deck} vs ${match.opp_deck}?`);
    if (!ok) return;

    try {
      await api.deleteMatch(match.id);
      setMatches((prev) => prev.filter((m) => m.id !== match.id));
      await refreshMyDecks();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleLogout() {
    await api.logout();
    setUser(null);
    setDecks([]);
    setMyDecks([]);
    setMatches([]);
  }

  if (loading) return <p className="center">Cargando...</p>;
  if (!user) return <AuthForm onLogin={handleLogin} />;

  return (
    <div className="container">
      <header className="header">
        <h1>TCG Tracker</h1>
        <DeckSwitcher
          myDecks={myDecks}
          activeDeck={activeDeck}
          allDecks={decks}
          onSelect={setActiveDeckId}
          onAdd={handleAddDeck}
          onRemove={handleRemoveDeck}
        />
        <div className="header-user">
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