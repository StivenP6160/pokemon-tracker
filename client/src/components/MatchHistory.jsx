import { useState } from 'react';
import DeckIcons from './DeckIcons.jsx';

const RESULT_LABELS = { win: 'Victoria', loss: 'Derrota', tie: 'Empate' };

// Los botones del filtro: "all" muestra todo, los demás un resultado
const FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'win', label: 'Victorias' },
  { value: 'loss', label: 'Derrotas' },
  { value: 'tie', label: 'Empates' },
];

const EMPTY_MESSAGES = {
  win: 'No hay victorias registradas con este deck.',
  loss: 'No hay derrotas registradas con este deck.',
  tie: 'No hay empates registrados con este deck.',
};

function formatDate(iso) {
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

// ¿Cuántas partidas pasan este filtro?
function countFor(matches, value) {
  if (value === 'all') return matches.length;
  return matches.filter((m) => m.result === value).length;
}

export default function MatchHistory({ deckName, matches, onDelete }) {
  const [filter, setFilter] = useState('all');

  // Las partidas que se ven en pantalla según el botón elegido
  const visibleMatches = filter === 'all' ? matches : matches.filter((m) => m.result === filter);

  return (
    <section className="card">
      <h2>Historial{deckName ? ` · ${deckName}` : ''} ({matches.length})</h2>

      {matches.length === 0 ? (
        <p className="muted">Aún no has registrado partidas.</p>
      ) : (
        <>
          <div className="toggle-group">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`toggle ${filter === f.value ? `active ${f.value}` : ''}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label} ({countFor(matches, f.value)})
              </button>
            ))}
          </div>

          {visibleMatches.length === 0 ? (
            <p className="muted">{EMPTY_MESSAGES[filter]}</p>
          ) : (
            <ul className="match-list">
              {visibleMatches.map((m) => (
                <li key={m.id} className="match">
                  <div className="match-main">
                    <span className={`badge ${m.result}`}>{RESULT_LABELS[m.result]}</span>
                    <span className="deck-name">
                      <DeckIcons icons={m.my_icons} />
                      <strong>{m.my_deck}</strong>
                    </span>
                    <span className="vs">vs</span>
                    <span className="deck-name">
                      <DeckIcons icons={m.opp_icons} />
                      {m.opp_deck}
                    </span>
                  </div>

                  <div className="match-meta">
                    <span>{m.went_first ? 'Fui primero' : 'Fui segundo'}</span>
                    <span>{formatDate(m.played_at)}</span>
                    <button className="link danger" onClick={() => onDelete(m)}>
                      Borrar
                    </button>
                  </div>

                  {m.notes && <p className="match-notes">{m.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}