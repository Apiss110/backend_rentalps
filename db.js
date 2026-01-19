import mysql from "mysql2";

// Ambil dari environment variables Railway
const connection = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
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

export default connection; // ✅ wajib pakai default export
