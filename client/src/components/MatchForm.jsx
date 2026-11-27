import { useState } from 'react';
import DeckPicker from './DeckPicker.jsx';

const RESULTS = [
  { value: 'win', label: 'Victoria' },
  { value: 'loss', label: 'Derrota' },
  { value: 'tie', label: 'Empate' },
];

const EMPTY = ['', ''];

export default function MatchForm({ decks, onSubmit }) {
  const [myIcons, setMyIcons] = useState(EMPTY);
  const [oppIcons, setOppIcons] = useState(EMPTY);
  const [wentFirst, setWentFirst] = useState(null);
  const [result, setResult] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaved(false);

    const mine = myIcons.filter(Boolean);
    const opp = oppIcons.filter(Boolean);

    if (mine.length === 0 || opp.length === 0) {
      return setError('Elige al menos un Pokémon para tu deck y para el del rival');
    }
    if (wentFirst === null) return setError('Indica si fuiste primero o segundo');
    if (!result) return setError('Elige el resultado');

    setSending(true);
    try {
      await onSubmit({ myIcons: mine, oppIcons: opp, went_first: wentFirst, result, notes });
      setSaved(true);
      // Limpia el formulario, pero deja tu deck (normalmente juegas el mismo)
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

  return (
    <section className="card">
      <h2>Registrar partida</h2>

      <form className="match-form" onSubmit={handleSubmit}>
        <DeckPicker label="Mi deck" icons={myIcons} onChange={setMyIcons} decks={decks} />
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