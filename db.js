import mysql from "mysql2";

const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10,
});


db.connect((err) => {
  if (err) {
    console.error("DB ERROR:", err);
  } else {
    console.log("MySQL connected");
  }
});

export default db;
