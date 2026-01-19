import express from "express";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';

// --- ROUTES IMPORTS ---
import psRoutes from "./routes/ps.routes.js";
import packageRoutes from "./routes/package.routes.js";
import rentalRoutes from "./routes/rental.routes.js";
import authRoutes from "./routes/auth.routes.js"; 
import customerRoutes from './routes/customer.routes.js';
import db from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// --- USE ROUTES ---
app.use("/ps", psRoutes);
app.use("/packages", packageRoutes);
app.use("/rentals", rentalRoutes);
app.use("/auth", authRoutes); 
app.use('/customers', customerRoutes); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// SERVER
app.listen(3000, () => {
  console.log("Server running on port 3000");
});

// --- ROBOT OTOMATIS (Update Setiap 1 Menit) ---
setInterval(() => {
  // 1. Cari rental yang AKTIF tapi WAKTUNYA SUDAH HABIS
  db.query(
    `SELECT * FROM rentals WHERE status = 'active' AND end_time <= NOW()`,
    (err, rentals) => {
      if (err) return console.error("Auto-finish check error:", err);

      rentals.forEach((rental) => {
        // A. Ubah Status Rental jadi 'finished'
        db.query("UPDATE rentals SET status = 'finished' WHERE id = ?", [rental.id]);

        // B. Ubah Status PS Unit jadi 'available' (Opsional, buat kerapian database)
        db.query("UPDATE ps_units SET status = 'available' WHERE id = ?", [rental.ps_id]);

        console.log(`[SYSTEM] Rental ID ${rental.id} otomatis selesai (Waktu Habis).`);
      });
    }
  );
}, 60000);