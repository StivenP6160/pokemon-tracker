// Función base: hace el pedido a la API y maneja los errores
async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null; // respuesta sin contenido (ej. al borrar)

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error ?? `Error ${res.status} en ${path}`);
  }
  return data;
}

// Funciones listas para usar desde los componentes
export const api = {
  me: () => request('/auth/me'),
  register: (username, password) =>
    request('/auth/register', { method: 'POST', body: { username, password } }),
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: { username, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getDecks: () => request('/decks'),
  createDeck: (name) => request('/decks', { method: 'POST', body: { name } }),
  getMatches: () => request('/matches'),
  createMatch: (match) => request('/matches', { method: 'POST', body: match }),
  deleteMatch: (id) => request(`/matches/${id}`, { method: 'DELETE' }),
  getStats: (filters = {}) => request(`/stats?${new URLSearchParams(filters)}`),
};