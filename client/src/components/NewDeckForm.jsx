import { useState } from 'react';

export default function NewDeckForm({ onCreate }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const deck = await onCreate(name);
      setMessage(`"${deck.name}" agregado a Mis decks`);
      setIsError(false);
      setName('');
    } catch (err) {
      setMessage(err.message);
      setIsError(true);
    }
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <input
        placeholder="¿Tu deck no está? Escribe su nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit" className="btn-secondary">Agregar deck</button>
      {message && <p className={isError ? 'error' : 'success'}>{message}</p>}
    </form>
  );
}