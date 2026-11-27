import { useEffect, useRef, useState } from 'react';
import DeckIcons from './DeckIcons.jsx';
import DeckPicker from './DeckPicker.jsx';

const EMPTY = ['', ''];

export default function DeckSwitcher({ myDecks, activeDeck, allDecks, onSelect, onAdd, onRemove }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newIcons, setNewIcons] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const boxRef = useRef(null);

  // Cierra el menú si haces clic por fuera
  useEffect(() => {
    if (!open) return;

    function handleClick(e) {
      if (!boxRef.current.contains(e.target)) {
        setOpen(false);
        setAdding(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function closeAll() {
    setOpen(false);
    setAdding(false);
    setNewIcons(EMPTY);
    setError('');
  }

  function choose(deck) {
    onSelect(deck.id);
    closeAll();
  }

  async function handleAdd() {
    const chosen = newIcons.filter(Boolean);
    if (chosen.length === 0) return setError('Elige al menos un Pokémon');

    setSaving(true);
    setError('');
    try {
      await onAdd(chosen);
      closeAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(deck) {
    try {
      await onRemove(deck);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="switcher" ref={boxRef}>
      <button
        type="button"
        className="switcher-button"
        onClick={() => (open ? closeAll() : setOpen(true))}
        aria-expanded={open}
      >
        {activeDeck ? (
          <>
            <DeckIcons icons={activeDeck.icons} />
            <span className="switcher-name">{activeDeck.name}</span>
          </>
        ) : (
          <span className="switcher-name">Elige tu deck</span>
        )}
        <span className="picker-chevron" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="switcher-popover">
          {myDecks.length === 0 && !adding && (
            <p className="picker-hint">Todavía no tienes decks. Crea el primero.</p>
          )}

          <ul className="switcher-list">
            {myDecks.map((deck) => (
              <li key={deck.id}>
                <button
                  type="button"
                  className={`switcher-item ${deck.id === activeDeck?.id ? 'active' : ''}`}
                  onClick={() => choose(deck)}
                >
                  <DeckIcons icons={deck.icons} />
                  <span className="switcher-name">{deck.name}</span>
                  <span className="switcher-count">{deck.matches} partidas</span>
                </button>
                {deck.matches === 0 && (
                  <button
                    type="button"
                    className="picker-clear"
                    onClick={() => handleRemove(deck)}
                    aria-label={`Quitar ${deck.name}`}
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>

          {adding ? (
            <div className="switcher-add">
              <DeckPicker label="Nuevo deck" icons={newIcons} onChange={setNewIcons} decks={allDecks} />
              <div className="switcher-actions">
                <button type="button" onClick={handleAdd} disabled={saving}>
                  {saving ? 'Agregando...' : 'Agregar'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setAdding(false);
                    setNewIcons(EMPTY);
                    setError('');
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="switcher-new" onClick={() => setAdding(true)}>
              + Nuevo deck
            </button>
          )}

          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  );
}