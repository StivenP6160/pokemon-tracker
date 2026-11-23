import DeckIcons from './DeckIcons.jsx';

const RESULT_LABELS = { win: 'Victoria', loss: 'Derrota', tie: 'Empate' };

function formatDate(iso) {
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function MatchHistory({ matches, onDelete }) {
  return (
    <section className="card">
      <h2>Historial ({matches.length})</h2>

      {matches.length === 0 ? (
        <p className="muted">Aún no has registrado partidas.</p>
      ) : (
        <ul className="match-list">
          {matches.map((m) => (
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
    </section>
  );
}