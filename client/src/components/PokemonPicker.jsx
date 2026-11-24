import { useEffect, useId, useMemo, useRef, useState } from 'react';
import POKEMON from '../data/pokemon.json';

const MAX_RESULTS = 30;

// "charizard-mega-y" → "Charizard Mega Y"
export function prettyName(slug) {
  return slug
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

export default function PokemonPicker({ value, onChange, placeholder = 'Elegir Pokémon...' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0); // posición de la opción resaltada
  const boxRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();

  // Filtra la lista según lo que escribes
  const results = useMemo(() => {
    const words = query.toLowerCase().split(/[\s-]+/).filter(Boolean);
    if (words.length === 0) return [];

    const matches = POKEMON.filter((p) => words.every((w) => p.includes(w)));
    const first = matches.filter((p) => p.startsWith(words[0]));
    const rest = matches.filter((p) => !p.startsWith(words[0]));
    return [...first, ...rest].slice(0, MAX_RESULTS);
  }, [query]);

  // Cierra el cuadro si haces clic por fuera
  useEffect(() => {
    if (!open) return;

    function handleClick(e) {
      if (!boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Si la opción resaltada queda fuera de la vista, desplaza la lista hasta ella
  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function select(slug) {
    onChange(slug);
    setOpen(false);
    setQuery('');
    setActive(0);
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter') {
      e.preventDefault(); // que Enter no envíe el formulario
      if (results[active]) select(results[active]);
    }
    if (e.key === 'Escape') setOpen(false);
  }

  return (
    <div className="picker" ref={boxRef}>
      {value ? (
        <div className="picker-selected">
          <img src={`/pokemon/${value}.png`} alt="" />
          <span>{prettyName(value)}</span>
          <button
            type="button"
            className="picker-clear"
            onClick={() => onChange('')}
            aria-label={`Quitar ${prettyName(value)}`}
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="picker-button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {placeholder}
          <span className="picker-chevron" aria-hidden="true">⇕</span>
        </button>
      )}

      {open && (
        <div className="picker-popover">
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0); // al escribir, vuelve a resaltar la primera opción
            }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar Pokémon..."
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listId}
            aria-activedescendant={results.length > 0 ? `${listId}-${active}` : undefined}
          />

          {query.trim() === '' ? (
            <p className="picker-hint">Empieza a escribir el nombre de un Pokémon...</p>
          ) : results.length === 0 ? (
            <p className="picker-hint">No encontré ese Pokémon.</p>
          ) : (
            <ul className="picker-list" role="listbox" id={listId} ref={listRef}>
              {results.map((slug, i) => (
                <li key={slug} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    tabIndex={-1}
                    className={i === active ? 'active' : ''}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => select(slug)}
                  >
                    <img src={`/pokemon/${slug}.png`} alt="" loading="lazy" />
                    {prettyName(slug)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}