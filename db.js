import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "db_rentalps",
});

db.connect((err) => {
  if (err) {
    console.error("DB ERROR:", err);
  } else {
    console.log("MySQL connected");
  }
});

export default db;
