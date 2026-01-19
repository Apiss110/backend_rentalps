import express from 'express';
import db from '../db.js';

const router = express.Router();

// 1. AMBIL SEMUA PELANGGAN (Beserta Room yang sedang disewa)
router.get('/', (req, res) => {
    // Query ini menggabungkan tabel users dengan rentals (yang statusnya active)
    const sql = `
        SELECT u.id, u.username, u.email, u.phone, p.name as active_room 
        FROM users u 
        LEFT JOIN rentals r ON u.id = r.user_id AND r.status = 'active' 
        LEFT JOIN ps_units p ON r.ps_id = p.id 
        WHERE u.role = 'user'
        ORDER BY u.id DESC
    `;
    
    db.query(sql, (err, data) => {
        if(err) {
            console.error(err);
            return res.json({Error: "Gagal ambil data pelanggan"});
        }
        return res.json(data);
    });
});

// 2. HAPUS PELANGGAN
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    // Hapus user berdasarkan ID
    const sql = "DELETE FROM users WHERE id = ?";
    
    db.query(sql, [id], (err, result) => {
        if(err) {
            // Jika gagal (misal karena ada data sewa), kirim pesan error
            return res.json({Error: "Gagal menghapus (Mungkin user memiliki riwayat transaksi)"});
        }
        return res.json({Status: "Success"});
    });
});

export default router;