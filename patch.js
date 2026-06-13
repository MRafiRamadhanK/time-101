import mysql from 'mysql2/promise';

async function run() {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mrrk271003',
    database: 'time101_db'
  });
  try {
    await c.query("ALTER TABLE children ADD COLUMN gender VARCHAR(20) DEFAULT 'cewe'");
    console.log('Column added successfully.');
  } catch (err) {
    console.log('Error or already exists:', err.message);
  }
  await c.end();
}

run();
