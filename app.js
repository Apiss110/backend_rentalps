import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ROUTES
import psRoutes from "./routes/ps.routes.js";
import packageRoutes from "./routes/package.routes.js";
import rentalRoutes from "./routes/rental.routes.js";
import authRoutes from "./routes/auth.routes.js";
import customerRoutes from "./routes/customer.routes.js";

import { dbPromise } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ROUTES
app.use("/ps", psRoutes);
app.use("/packages", packageRoutes);
app.use("/rentals", rentalRoutes);
app.use("/auth", authRoutes);
app.use("/customers", customerRoutes);

// SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

// ===============================
// AUTO FINISH RENTAL (CRON STYLE)
// ===============================
setInterval(async () => {
  try {
    const [rentals] = await dbPromise.query(
      `SELECT id, ps_id FROM rentals 
       WHERE status = 'active' AND end_time <= NOW()`
    );

    if (!rentals.length) return;

    for (const rental of rentals) {
      await dbPromise.query(
        "UPDATE rentals SET status = 'finished' WHERE id = ?",
        [rental.id]
      );

      await dbPromise.query(
        "UPDATE ps_units SET status = 'available' WHERE id = ?",
        [rental.ps_id]
      );

      console.log(`[SYSTEM] Rental ${rental.id} auto-finished`);
    }
  } catch (err) {
    console.error("[AUTO-FINISH ERROR]", err.message);
  }
}, 60000);
