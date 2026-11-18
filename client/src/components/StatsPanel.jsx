import { useEffect, useState } from 'react';
import { api } from '../api.js';
import DeckSelect from './DeckSelect.jsx';

// Barra horizontal: victorias / derrotas / empates en proporción
function RecordBar({ stats }) {
  if (stats.total === 0) return <div className="record-bar empty" />;

  const parts = [
    { key: 'win', label: 'Victorias', value: stats.wins, pct: stats.win_rate },
    { key: 'loss', label: 'Derrotas', value: stats.losses, pct: stats.loss_rate },
    { key: 'tie', label: 'Empates', value: stats.ties, pct: stats.tie_rate },
  ].filter((p) => p.value > 0);

  return (
    <div
      className="record-bar"
      role="img"
      aria-label={`${stats.wins} victorias, ${stats.losses} derrotas, ${stats.ties} empates`}
    >
      {parts.map((p) => (
        <span
          key={p.key}
          className={`segment ${p.key}`}
          style={{ flexGrow: p.value }}
          title={`${p.label}: ${p.value} (${p.pct}%)`}
        />
      ))}
    </div>
  );
}

// Tarjeta con el % de victorias de un grupo
function StatTile({ title, stats }) {
  const empty = stats.total === 0;

  return (
    <div className="stat-tile">
      <span className="stat-title">{title}</span>
      <span className="stat-value">{empty ? '—' : `${stats.win_rate}%`}</span>
      <span className="stat-sub">
        {empty
          ? 'Sin partidas'
          : `${stats.wins}V · ${stats.losses}D · ${stats.ties}E · ${stats.total} partidas`}
      </span>
      <RecordBar stats={stats} />
    </div>
  );
}

export default function StatsPanel({ decks, matches }) {
  const [myDeckId, setMyDeckId] = useState('');
  const [oppDeckId, setOppDeckId] = useState('');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  // Pide las estadísticas cada vez que cambian los filtros o las partidas
  useEffect(() => {
    const filters = {};
    if (myDeckId) filters.my_deck_id = myDeckId;
    if (oppDeckId) filters.opp_deck_id = oppDeckId;

    let active = true;
    api
      .getStats(filters)
      .then((data) => {
        if (active) {
          setStats(data);
          setError('');
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false; // ignora respuestas viejas si cambias el filtro rápido
    };
  }, [myDeckId, oppDeckId, matches]);

  function showMatchup(m) {
    setMyDeckId(String(m.my_deck_id));
    setOppDeckId(String(m.opp_deck_id));
  }

  function clearFilters() {
    setMyDeckId('');
    setOppDeckId('');
  }

  const hasFilters = myDeckId || oppDeckId;

  return (
    <section className="card">
      <h2>Estadísticas</h2>

      <div className="stats-filters">
        <DeckSelect label="Mi deck" value={myDeckId} onChange={setMyDeckId} decks={decks} placeholder="Todos" />
        <DeckSelect label="Deck rival" value={oppDeckId} onChange={setOppDeckId} decks={decks} placeholder="Todos" />
        <button type="button" className="btn-secondary" onClick={clearFilters} disabled={!hasFilters}>
          Quitar filtros
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {!stats && !error && <p className="muted">Cargando estadísticas...</p>}

      {stats && (
        <>
          <div className="legend">
            <span><i className="swatch win" /> Victoria</span>
            <span><i className="swatch loss" /> Derrota</span>
            <span><i className="swatch tie" /> Empate</span>
          </div>

          <div className="stat-tiles">
            <StatTile title="General · % victorias" stats={stats.overall} />
            <StatTile title="Yendo primero" stats={stats.going_first} />
            <StatTile title="Yendo segundo" stats={stats.going_second} />
          </div>

          <h3 className="subtitle">Matchups</h3>

          {stats.by_matchup.length === 0 ? (
            <p className="muted">No hay partidas con estos filtros.</p>
          ) : (
            <div className="table-wrap">
              <table className="matchup-table">
                <thead>
                  <tr>
                    <th>Mi deck</th>
                    <th>Rival</th>
                    <th>Partidas</th>
                    <th>V-D-E</th>
                    <th>% Victorias</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.by_matchup.map((m) => (
                    <tr key={`${m.my_deck_id}-${m.opp_deck_id}`}>
                      <td>{m.my_deck}</td>
                      <td>{m.opp_deck}</td>
                      <td className="num">{m.total}</td>
                      <td className="num">{m.wins}-{m.losses}-{m.ties}</td>
                      <td>
                        <div className="rate-cell">
                          <RecordBar stats={m} />
                          <span className="num">{m.win_rate}%</span>
                        </div>
                      </td>
                      <td>
                        <button type="button" className="link" onClick={() => showMatchup(m)}>
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}