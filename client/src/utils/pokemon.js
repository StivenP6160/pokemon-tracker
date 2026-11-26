// "charizard-mega-y" → "Charizard Mega Y"
export function prettyName(slug) {
  return slug
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}