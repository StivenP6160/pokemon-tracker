import { useState } from 'react';
import DeckIcons from './DeckIcons.jsx';
import DeckPicker from './DeckPicker.jsx';

const RESULTS = [
  { value: 'win', label: 'Victoria' },
  { value: 'loss', label: 'Derrota' },
  { value: 'tie', label: 'Empate' },
];

const EMPTY = ['', ''];
const MAX_RECENT = 5;

// Recorre las partidas (de la más nueva a la más vieja) y se queda
// con los primeros 5 decks rivales distintos
function getRecentRivals(matches) {
  const seen = new Set();
  const rivals = [];

  for (const m of matches) {
    if (seen.has(m.opp_deck_id)) continue; // ya lo tenemos, lo saltamos
    seen.add(m.opp_deck_id);
    rivals.push({ id: m.opp_deck_id, name: m.opp_deck, icons: m.opp_icons });
    if (rivals.length === MAX_RECENT) break; // ya tenemos 5, paramos
  }

  return rivals;
}

// ¿El deck rival elegido ahora mismo tiene exactamente estos Pokémon?
function isSelected(oppIcons, icons) {
  const chosen = oppIcons.filter(Boolean);
  return chosen.length === icons.length && chosen.every((x) => icons.includes(x));
}

export default function MatchForm({ activeDeck, decks, matches, onSubmit }) {
  const [oppIcons, setOppIcons] = useState(EMPTY);
  const [wentFirst, setWentFirst] = useState(null);
  const [result, setResult] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);

  const recentRivals = getRecentRivals(matches);

  // Llena el buscador con los Pokémon del rival (siempre 2 casillas)
  function pickRival(rival) {
    setOppIcons([rival.icons[0] ?? '', rival.icons[1] ?? '']);
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaved(false);

    const opp = oppIcons.filter(Boolean);
    if (opp.length === 0) return setError('Elige al menos un Pokémon del deck rival');
    if (wentFirst === null) return setError('Indica si fuiste primero o segundo');
    if (!result) return setError('Elige el resultado');

    setSending(true);
    try {
      await onSubmit({ oppIcons: opp, went_first: wentFirst, result, notes });
      setSaved(true);
      setOppIcons(EMPTY);
      setWentFirst(null);
      setResult(null);
      setNotes('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (!activeDeck) {
    return (
      <section className="card">
        <h2>Registrar partida</h2>
        <p className="muted">Elige o crea tu deck en el selector de arriba para empezar a registrar partidas.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Registrar partida</h2>

      <form className="match-form" onSubmit={handleSubmit}>
        <div className="playing-with">
          <span className="muted">Jugando con</span>
          <span className="deck-name">
            <DeckIcons icons={activeDeck.icons} />
            <strong>{activeDeck.name}</strong>
          </span>
        </div>

        {recentRivals.length > 0 && (
          <fieldset>
            <legend>Rivales recientes</legend>
            <div className="toggle-group">
              {recentRivals.map((rival) => (
                <button
                  key={rival.id}
                  type="button"
                  className={`toggle ${isSelected(oppIcons, rival.icons) ? 'active' : ''}`}
                  onClick={() => pickRival(rival)}
                  title={rival.name}
                >
                  <DeckIcons icons={rival.icons} />
                  {rival.name}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <DeckPicker label="Deck rival" icons={oppIcons} onChange={setOppIcons} decks={decks} />

        <fieldset>
          <legend>Turno</legend>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle ${wentFirst === true ? 'active' : ''}`}
              onClick={() => setWentFirst(true)}
            >
              Fui primero
            </button>
            <button
              type="button"
              className={`toggle ${wentFirst === false ? 'active' : ''}`}
              onClick={() => setWentFirst(false)}
            >
              Fui segundo
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>Resultado</legend>
          <div className="toggle-group">
            {RESULTS.map((r) => (
              <button
                key={r.value}
                type="button"
                className={`toggle ${result === r.value ? `active ${r.value}` : ''}`}
                onClick={() => setResult(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label>
          Notas (opcional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="¿Qué pasó en la partida? Mulligans, jugadas clave, errores..."
            maxLength={2000}
          />
        </label>

        {error && <p className="error">{error}</p>}
        {saved && <p className="form-success">✅ Partida guardada</p>}

        <button type="submit" disabled={sending}>
          {sending ? 'Guardando...' : 'Guardar partida'}
        </button>
      </form>
    </section>
  );
}