const fs = require('fs');
const path = require('path');
const { pool } = require('./config/db');

async function runMigration() {
  const migrationPath = path.join(__dirname, '../migrations/v1.2_enterprise_enhancements.sql');
  console.log(`Reading migration from: ${migrationPath}`);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  const client = await pool.connect();
  try {
    console.log('Applying migration...');
    await client.query(sql);
    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
