const mysql = require("mysql2");

// Ambil dari environment variables Railway
const connection = mysql.createConnection({
  host: process.env.MYSQLHOST,      // host
  user: process.env.MYSQLUSER,      // user
  password: process.env.MYSQLPASSWORD, // password
  database: process.env.MYSQLDATABASE, // database
  port: process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectTimeout: 10000,
  queueLimit: 0
});

connection.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Database connected successfully!");
  }
});

module.exports = connection;
