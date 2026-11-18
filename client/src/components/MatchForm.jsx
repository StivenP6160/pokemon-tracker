import { useState } from 'react';
import NewDeckForm from './NewDeckForm.jsx';
import DeckSelect from './DeckSelect.jsx';

const RESULTS = [
  { value: 'win', label: 'Victoria' },
  { value: 'loss', label: 'Derrota' },
  { value: 'tie', label: 'Empate' },
];

export default function MatchForm({ decks, onSubmit, onCreateDeck }) {
  const [myDeckId, setMyDeckId] = useState('');
  const [oppDeckId, setOppDeckId] = useState('');
  const [wentFirst, setWentFirst] = useState(null); // null = aún no elegido
  const [result, setResult] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!myDeckId || !oppDeckId) return setError('Elige tu deck y el del rival');
    if (wentFirst === null) return setError('Indica si fuiste primero o segundo');
    if (!result) return setError('Elige el resultado');

    setSending(true);
    try {
      await onSubmit({
        my_deck_id: Number(myDeckId),
        opp_deck_id: Number(oppDeckId),
        went_first: wentFirst,
        result,
        notes,
      });
      // Limpia el formulario, pero deja tu deck (normalmente juegas el mismo)
      setOppDeckId('');
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
        <div className="row">
          <DeckSelect label="Mi deck" value={myDeckId} onChange={setMyDeckId} decks={decks} />
          <DeckSelect label="Deck rival" value={oppDeckId} onChange={setOppDeckId} decks={decks} />
        </div>

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

        <button type="submit" disabled={sending}>
          {sending ? 'Guardando...' : 'Guardar partida'}
        </button>
      </form>

      <NewDeckForm onCreate={onCreateDeck} />
    </section>
  );
}