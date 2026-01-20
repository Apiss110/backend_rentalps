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
app.use("/api/ps", psRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
// ROOT HEALTH CHECK (WAJIB DI CLOUD)
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Backend Rental PS is running 🚀",
  });
});
// SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

// ===============================
// AUTO FINISH RENTAL (CRON STYLE)
// ===============================
app.post("/system/auto-finish", async (req, res) => {
  try {
    const [rentals] = await dbPromise.query(
      `SELECT id, ps_id FROM rentals 
       WHERE status = 'active' AND end_time <= NOW()`
    );

    for (const rental of rentals) {
      await dbPromise.query(
        "UPDATE rentals SET status = 'finished' WHERE id = ?",
        [rental.id]
      );
      await dbPromise.query(
        "UPDATE ps_units SET status = 'available' WHERE id = ?",
        [rental.ps_id]
      );
    }

    res.json({ success: true, finished: rentals.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

