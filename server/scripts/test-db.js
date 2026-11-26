import pool from '../db.js';

const client = await pool.connect();

try {
  await client.query('BEGIN'); // empieza un "ensayo"

  // 1. Crear un usuario de prueba
  const user = await client.query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
    ['test_db_user', 'hash-falso']
  );
  const userId = user.rows[0].id;
  console.log('Usuario creado:', user.rows[0]);

  // 2. Tomar dos decks globales cualquiera
  const decks = await client.query(
    'SELECT id, name FROM decks WHERE user_id IS NULL ORDER BY name LIMIT 2'
  );
  if (decks.rows.length < 2) throw new Error('Se necesitan al menos 2 decks globales. Corre npm run db:setup');
  const [deckA, deckB] = decks.rows;

  // 3. Guardar una partida
  await client.query(
    `INSERT INTO matches (user_id, my_deck_id, opp_deck_id, went_first, result, notes)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, deckA.id, deckB.id, true, 'win', 'Partida de prueba']
  );

  // 4. Leer el historial con los NOMBRES de los decks
  const history = await client.query(
    `SELECT m.id, mine.name AS mi_deck, opp.name AS rival, m.went_first, m.result, m.notes
       FROM matches m
       JOIN decks mine ON mine.id = m.my_deck_id
       JOIN decks opp  ON opp.id  = m.opp_deck_id
      WHERE m.user_id = $1`,
    [userId]
  );
  console.table(history.rows);

  // 5. Probar el guardián: resultado inválido
  try {
    await client.query(
      `INSERT INTO matches (user_id, my_deck_id, opp_deck_id, went_first, result)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, deckA.id, deckB.id, false, 'ganamos']
    );
    console.log('❌ La BD aceptó un resultado inválido (algo está mal)');
  } catch (err) {
    console.log('✅ La BD rechazó el resultado inválido:', err.message);
  }
} finally {
  await client.query('ROLLBACK'); // deshace TODO el ensayo
  client.release();
  await pool.end();
}