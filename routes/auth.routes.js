import express from 'express';
import db from '../db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// ... (Register, Login, Logout, Create-Admin SAMA SEPERTI SEBELUMNYA) ...

router.post('/register', (req, res) => {
    const { username, email, password, phone } = req.body;

    console.log("REQ BODY:", req.body);

    if (!username || !email || !password || !phone) {
        return res.status(400).json({
            error: "Data tidak lengkap",
            body: req.body
        });
    }

    const sql = `
        INSERT INTO users (username, email, password, role, phone)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [username, email, password, 'user', phone], (err) => {
        if (err) {
            console.error("MYSQL ERROR:", err);
            return res.status(500).json({
                error: "Gagal register",
                detail: err.message
            });
        }

        return res.status(201).json({ status: "Success" });
    });
});


router.post('/login', (req, res) => {
    const sql = "SELECT * FROM users WHERE username = ?";
    db.query(sql, [req.body.username], (err, data) => {
        if(err) return res.json({Error: "Server Error"});
        if(data.length > 0) {
            // CEK STATUS DELETED
            if(data[0].role === 'deleted') return res.json({Error: "Akun ini telah dinonaktifkan."});
            
            if(req.body.password === data[0].password) {
                const token = jwt.sign({username: data[0].username}, "jwt-secret-key", {expiresIn: '1d'});
                return res.json({Status: "Success", Token: token, role: data[0].role, id: data[0].id, username: data[0].username});
            } else {
                return res.json({Error: "Password salah"});
            }
        } else {
            return res.json({Error: "Username tidak ditemukan"});
        }
    });
});

router.get('/logout', (req, res) => { res.clearCookie('token'); return res.json({Status: "Success"}); });

router.post('/create-admin', (req, res) => {
    const sql = "INSERT INTO users (`username`, `email`, `password`, `role`, `phone`) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [req.body.username, req.body.email, req.body.password, 'admin', req.body.phone], (err) => {
        if(err) return res.json({Error: err.sqlMessage});
        return res.json({Status: "Success"});
    });
});

// --- BAGIAN PENTING: FILTER USER AKTIF SAJA ---
router.get('/users', (req, res) => {
    // Hanya ambil user yang role-nya BUKAN 'deleted'
    const sql = "SELECT id, username, email, role, phone FROM users WHERE role != 'deleted' ORDER BY id DESC";
    db.query(sql, (err, data) => {
        if(err) return res.json({Error: "Gagal ambil users"});
        return res.json(data);
    });
});

// --- BAGIAN PENTING: SOFT DELETE USER ---
router.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    // Ubah status jadi 'deleted' (JANGAN DELETE FROM)
    const sql = "UPDATE users SET role = 'deleted' WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if(err) {
            console.error(err);
            return res.json({Error: "Gagal menghapus user"});
        }
        return res.json({Status: "Success"});
    });
});

export default router;