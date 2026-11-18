import pool from '../db.js';

const client = await pool.connect();

try {
  await client.query('BEGIN'); // empieza un "ensayo"

  // 1. Crear un usuario de prueba
  const user = await client.query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
    ['john_test', 'hash-falso']
  );
  const userId = user.rows[0].id;
  console.log('Usuario creado:', user.rows[0]);

  // 2. Buscar los ids de dos decks
  const decks = await client.query(
    'SELECT id, name FROM decks WHERE name IN ($1, $2)',
    ['Alakazam Powerful Hand', 'Dragapult ex']
  );
  const alakazam  = decks.rows.find((d) => d.name === 'Alakazam Powerful Hand').id;
  const dragapult = decks.rows.find((d) => d.name === 'Dragapult ex').id;

  // 3. Guardar una partida
  await client.query(
    `INSERT INTO matches (user_id, my_deck_id, opp_deck_id, went_first, result, notes)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, alakazam, dragapult, true, 'win', 'Partida de prueba']
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
      [userId, alakazam, dragapult, false, 'ganamos']
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