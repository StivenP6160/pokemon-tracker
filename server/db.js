import pg from 'pg';

// Un "pool" es un grupo de conexiones reutilizables a la BD
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Si la BD cierra una conexión inactiva, lo registramos en vez de dejar caer la app
pool.on('error', (err) => {
  console.error('La BD cerró una conexión inactiva:', err.message);
});

export default pool;