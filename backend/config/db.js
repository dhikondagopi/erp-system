require('dotenv').config();

const { Pool } = require('pg');

// ======================================================
// Environment Validation
// ======================================================
const REQUIRED_ENV_VARS = ['DATABASE_URL'];

const missingEnv = REQUIRED_ENV_VARS.filter(
  (key) => !process.env[key] || process.env[key].trim() === ''
);

if (missingEnv.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnv.forEach((key) => console.error(`   • ${key}`));
  process.exit(1);
}

// ======================================================
// PostgreSQL Pool
// ======================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false,
        }
      : false,

  max: Number(process.env.DB_MAX_CONNECTIONS) || 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  allowExitOnIdle: false,
});

// ======================================================
// Pool Events
// ======================================================
pool.on('connect', (client) => {
  console.log('✅ PostgreSQL client connected.');

  client.on('error', (err) => {
    console.error('❌ PostgreSQL client error:', err.message);
  });
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL Pool Error');

  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  } else {
    console.error(err.message);
  }
});

// ======================================================
// Query Helper
// ======================================================
const query = async (text, params = []) => {
  const start = Date.now();

  try {
    const result = await pool.query(text, params);

    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - start;

      console.log(
        `🟢 Query executed (${duration} ms) | Rows: ${result.rowCount}`
      );
    }

    return result;
  } catch (error) {
    console.error('❌ Database Query Failed');

    if (process.env.NODE_ENV === 'development') {
      console.error('SQL:', text);
      console.error('Params:', params);
      console.error(error);
    } else {
      console.error(error.message);
    }

    throw error;
  }
};

// ======================================================
// Database Health Check
// ======================================================
const checkConnection = async (retries = 3) => {
  while (retries > 0) {
    try {
      const result = await pool.query(`
        SELECT
          current_database() AS database_name,
          current_user AS database_user,
          version() AS postgres_version,
          NOW() AS server_time;
      `);

      const info = result.rows[0];

      console.log('\n========================================');
      console.log('✅ PostgreSQL Connected');
      console.log('----------------------------------------');
      console.log(`Database : ${info.database_name}`);
      console.log(`User     : ${info.database_user}`);
      console.log(`Time     : ${info.server_time}`);
      console.log('========================================\n');

      return true;
    } catch (error) {
      retries--;

      console.error(
        `❌ Database connection failed. Retries left: ${retries}`
      );

      if (retries === 0) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
};

// ======================================================
// Pool Statistics
// ======================================================
const getPoolStats = () => ({
  total: pool.totalCount,
  idle: pool.idleCount,
  waiting: pool.waitingCount,
});

// ======================================================
// Close Pool
// ======================================================
const closePool = async () => {
  try {
    await pool.end();
    console.log('✅ PostgreSQL pool closed.');
  } catch (error) {
    console.error('❌ Failed to close PostgreSQL pool.');

    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    } else {
      console.error(error.message);
    }

    throw error;
  }
};

// ======================================================
// Exports
// ======================================================
module.exports = {
  pool,
  query,
  checkConnection,
  closePool,
  getPoolStats,
};