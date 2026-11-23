export default function DeckIcons({ icons = [] }) {
  if (icons.length === 0) return null;

  return (
    <span className="deck-icons">
      {icons.map((slug) => (
        <img
          key={slug}
          src={`/pokemon/${slug}.png`}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ))}
    </span>
  );
}