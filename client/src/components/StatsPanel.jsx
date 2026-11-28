import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import DeckIcons from './DeckIcons.jsx';

// Filtros de la tabla de matchups: cada uno dice qué filas deja pasar
const MATCHUP_FILTERS = [
  { value: 'all', label: 'Todos', test: () => true },
  { value: 'good', label: 'Favorables', test: (m) => Number(m.win_rate) > 50 },
  { value: 'bad', label: 'Desfavorables', test: (m) => Number(m.win_rate) < 50 },
];

const EMPTY_MESSAGES = {
  good: 'No tienes matchups favorables (más de 50%) todavía.',
  bad: 'No tienes matchups desfavorables (menos de 50%). ¡Bien ahí!',
};

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

// Compara tu % de victorias en un matchup con el del meta
function MetaComparison({ mine, meta }) {
  if (!meta) {
    return (
      <div className="meta-box">
        <h3 className="subtitle">Comparación con el meta</h3>
        <p className="muted">
          Sin datos del meta para este matchup: alguno de los dos decks no es un deck de Limitless,
          o no se jugó en los torneos recientes.
        </p>
      </div>
    );
  }

  const diff = Math.round((mine.win_rate - meta.win_rate) * 10) / 10;
  const updated = new Date(meta.updated_at).toLocaleDateString('es-CO', { dateStyle: 'medium' });

  return (
    <div className="meta-box">
      <h3 className="subtitle">Comparación con el meta</h3>

      <div className="meta-grid">
        <StatTile title="Tú" stats={mine} />
        <StatTile title="Meta · torneos online de Limitless" stats={meta} />
      </div>

      {mine.total > 0 && (
        <p className={`meta-diff ${diff > 0 ? 'up' : diff < 0 ? 'down' : ''}`}>
          {diff > 0 && `▲ ${diff} puntos por encima del meta`}
          {diff < 0 && `▼ ${Math.abs(diff)} puntos por debajo del meta`}
          {diff === 0 && 'Igual que el meta'}
        </p>
      )}

      {mine.total > 0 && mine.total < 10 && (
        <p className="muted small">
          Tienes pocas partidas en este matchup ({mine.total}): tu porcentaje puede cambiar mucho con
          cada resultado.
        </p>
      )}

      <p className="muted small">Datos del meta actualizados el {updated}.</p>
    </div>
  );
}

export default function StatsPanel({ activeDeck, matches }) {
  const [oppDeckId, setOppDeckId] = useState('');
  const [matchupFilter, setMatchupFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const deckId = activeDeck?.id;

  // Los rivales contra los que ha jugado este deck, sin repetir
  const rivals = useMemo(() => {
    const byId = new Map();
    for (const m of matches) {
      if (m.my_deck_id === deckId) byId.set(m.opp_deck_id, { id: m.opp_deck_id, name: m.opp_deck });
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [matches, deckId]);

  // Pide las estadísticas de tu deck activo (y del rival, si filtraste uno)
  useEffect(() => {
    if (!deckId) return;

    const filters = { my_deck_id: deckId };
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
      active = false;
    };
  }, [deckId, oppDeckId, matches]);

  if (!activeDeck) {
    return (
      <section className="card">
        <h2>Estadísticas</h2>
        <p className="muted">Elige o crea tu deck en el selector de arriba para ver tus estadísticas.</p>
      </section>
    );
  }

  const allMatchups = stats?.by_matchup ?? [];
  const currentFilter = MATCHUP_FILTERS.find((f) => f.value === matchupFilter);
  const visibleMatchups = allMatchups.filter(currentFilter.test);

  return (
    <section className="card">
      <h2>Estadísticas · {activeDeck.name}</h2>

      <div className="stats-filters">
        <label>
          Deck rival
          <select value={oppDeckId} onChange={(e) => setOppDeckId(e.target.value)}>
            <option value="">Todos</option>
            {rivals.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn-secondary" onClick={() => setOppDeckId('')} disabled={!oppDeckId}>
          Quitar filtro
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

          {oppDeckId && <MetaComparison mine={stats.overall} meta={stats.meta} />}

          <h3 className="subtitle">Matchups</h3>

          {allMatchups.length === 0 ? (
            <p className="muted">No hay partidas con este deck todavía.</p>
          ) : (
            <>
              <div className="toggle-group">
                {MATCHUP_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    className={`toggle ${matchupFilter === f.value ? 'active' : ''}`}
                    onClick={() => setMatchupFilter(f.value)}
                  >
                    {f.label} ({allMatchups.filter(f.test).length})
                  </button>
                ))}
              </div>

              {visibleMatchups.length === 0 ? (
                <p className="muted">{EMPTY_MESSAGES[matchupFilter]}</p>
              ) : (
                <div className="table-wrap">
                  <table className="matchup-table">
                    <thead>
                      <tr>
                        <th>Rival</th>
                        <th>Partidas</th>
                        <th>V-D-E</th>
                        <th>% Victorias</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleMatchups.map((m) => (
                        <tr key={m.opp_deck_id}>
                          <td>
                            <span className="deck-name">
                              <DeckIcons icons={m.opp_icons} />
                              {m.opp_deck}
                            </span>
                          </td>
                          <td className="num">{m.total}</td>
                          <td className="num">{m.wins}-{m.losses}-{m.ties}</td>
                          <td>
                            <div className="rate-cell">
                              <RecordBar stats={m} />
                              <span className="num">{m.win_rate}%</span>
                            </div>
                          </td>
                          <td>
                            <button type="button" className="link" onClick={() => setOppDeckId(String(m.opp_deck_id))}>
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
        </>
      )}
    </section>
  );
}