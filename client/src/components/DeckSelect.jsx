export default function DeckSelect({ label, value, onChange, decks, placeholder = 'Elige un deck...' }) {
  const meta = decks.filter((d) => !d.is_custom);
  const custom = decks.filter((d) => d.is_custom);

  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        <optgroup label="Meta">
          {meta.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </optgroup>
        {custom.length > 0 && (
          <optgroup label="Mis decks">
            {custom.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </optgroup>
        )}
      </select>
    </label>
  );
}