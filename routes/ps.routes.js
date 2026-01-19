import express from 'express';
import db from '../db.js';

const router = express.Router();

// --- 1. AMBIL SEMUA DATA ---
router.get('/', (req, res) => {
    const sql = "SELECT * FROM ps_units";
    db.query(sql, (err, data) => {
        if(err) return res.json({Error: "Error SQL"});
        return res.json(data);
    });
});

// --- 2. TAMBAH DATA ---
router.post('/add', (req, res) => {
    const sql = "INSERT INTO ps_units (name, price_per_hour, capacity, status) VALUES (?, ?, ?, 'available')";
    const values = [req.body.name, req.body.price, req.body.capacity];
    
    db.query(sql, values, (err, result) => {
        if(err) return res.json({Error: "Gagal insert data"});
        return res.json({Status: "Success"});
    });
});

// --- 3. EDIT / UPDATE DATA (INI YANG DITAMBAHKAN) ---
router.put('/update/:id', (req, res) => {
    const id = req.params.id;
    const sql = "UPDATE ps_units SET name=?, price_per_hour=?, capacity=? WHERE id=?";
    const values = [req.body.name, req.body.price, req.body.capacity, id];

    db.query(sql, values, (err, result) => {
        if(err) {
            console.error(err);
            return res.json({Error: "Gagal update data"});
        }
        return res.json({Status: "Success"});
    });
});

// --- 4. HAPUS DATA ---
router.delete('/delete/:id', (req, res) => {
    const sql = "DELETE FROM ps_units WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if(err) return res.json({Error: "Error delete"});
        return res.json({Status: "Success"});
    });
});

export default router;