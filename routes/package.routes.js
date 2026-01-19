import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/", (req, res) => {
  db.query("SELECT * FROM packages", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

export default router;
