const sql = require("mssql");

const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    enableArithAbort: true,
  },
  pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
  },
};

const pool = new sql.ConnectionPool(sqlConfig);
const poolConnect = pool.connect();

pool.on("error", (err) => {
  console.error("SQL Pool Error:", err);
});

module.exports = { sql, poolConnect, pool };
