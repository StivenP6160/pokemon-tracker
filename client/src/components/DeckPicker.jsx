import PokemonPicker from './PokemonPicker.jsx';
import { prettyName } from '../utils/pokemon.js';

// ¿Tienen los mismos Pokémon, sin importar el orden?
function sameSet(a, b) {
  return a.length === b.length && a.every((x) => b.includes(x));
}

export default function DeckPicker({ label, icons, onChange, decks }) {
  const chosen = icons.filter(Boolean);
  const match = chosen.length > 0 ? decks.find((d) => sameSet(d.icons, chosen)) : null;

  function setAt(index, slug) {
    const next = [...icons];
    next[index] = slug;
    onChange(next);
  }

  return (
    <fieldset className="deck-picker">
      <legend>{label}</legend>

      <div className="row">
        <PokemonPicker value={icons[0]} onChange={(slug) => setAt(0, slug)} />
        <PokemonPicker
          value={icons[1]}
          onChange={(slug) => setAt(1, slug)}
          placeholder="Segundo Pokémon (opcional)"
        />
      </div>

      {chosen.length > 0 && (
        <p className="deck-preview">
          {match ? (
            <>Deck: <strong>{match.name}</strong></>
          ) : (
            <>Deck nuevo: <strong>{chosen.map(prettyName).join(' / ')}</strong></>
          )}
        </p>
      )}
    </fieldset>
  );
}