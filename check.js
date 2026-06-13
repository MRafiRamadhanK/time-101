import mysql from 'mysql2/promise';

async function run() {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mrrk271003',
    database: 'time101_db'
  });
  const [rows] = await c.query("SELECT * FROM children");
  console.log(rows);
  await c.end();
}

run();
