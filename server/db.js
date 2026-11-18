import pg from 'pg';

// Un "pool" es un grupo de conexiones reutilizables a la BD
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export default pool;