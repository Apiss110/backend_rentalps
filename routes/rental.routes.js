import express from 'express';
import db from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; 

const router = express.Router();

// 1. KONFIGURASI UPLOAD
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, 'proof_' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });


// --- ROUTES ---

// A. AMBIL SEMUA
router.get('/', (req, res) => {
    const sql = `
        SELECT rentals.*, 
               ps_units.name as ps_name, 
               users.username,
               DATE_FORMAT(start_time, '%Y-%m-%d %H:%i:%s') as start_time_str 
        FROM rentals 
        LEFT JOIN ps_units ON rentals.ps_id = ps_units.id
        LEFT JOIN users ON rentals.user_id = users.id
        ORDER BY rentals.id DESC
    `;
    db.query(sql, (err, data) => {
        if(err) return res.json({Error: err.sqlMessage});
        return res.json(data);
    });
});

// B. BOOKING BARU
router.post('/', (req, res) => {
    const { ps_id, user_id, duration, rental_type, total_price, booking_date, start_time } = req.body;
    const startDateTime = `${booking_date} ${start_time}:00`; 

    const sqlRent = `
        INSERT INTO rentals (ps_id, user_id, duration, rental_type, total_price, status, start_time, end_time, payment_status) 
        VALUES (?, ?, ?, ?, ?, 'active', ?, DATE_ADD(?, INTERVAL ? HOUR), 'unpaid')
    `;

    db.query(sqlRent, [ps_id, user_id, duration, rental_type, total_price, startDateTime, startDateTime, duration], (err, result) => {
        if(err) return res.json({Error: "Gagal insert rental"});
        db.query("UPDATE ps_units SET status = 'in_use' WHERE id = ?", [ps_id]);
        return res.json({Status: "Success", rentalId: result.insertId});
    });
});

// C. DETAIL
router.get('/detail/:id', (req, res) => {
    const id = req.params.id;
    const sql = `
        SELECT rentals.*, ps_units.name as ps_name, ps_units.price_per_hour, 
               users.username, users.email, users.phone,
               DATE_FORMAT(rentals.start_time, '%H:%i') as jam_mulai, 
               DATE_FORMAT(rentals.end_time, '%H:%i') as jam_selesai,
               DATE_FORMAT(rentals.start_time, '%Y-%m-%d') as tanggal_sewa
        FROM rentals 
        LEFT JOIN ps_units ON rentals.ps_id = ps_units.id
        LEFT JOIN users ON rentals.user_id = users.id
        WHERE rentals.id = ?
    `;
    db.query(sql, [id], (err, data) => {
        if(err) return res.json({Error: "Error SQL"});
        if(data.length > 0) return res.json(data[0]);
        return res.json(null); 
    });
});

// D. UPDATE STATUS PEMBAYARAN
router.put('/update-status/:id', (req, res) => {
    const sql = "UPDATE rentals SET payment_status = ? WHERE id = ?";
    db.query(sql, [req.body.status, req.params.id], (err, result) => {
        if(err) return res.json({Error: err.message});
        return res.json({Status: "Success"});
    });
});

// E. LAPORAN
router.get('/reports', (req, res) => {
    const sql = `
        SELECT rentals.*, ps_units.name as ps_name, users.username,
               DATE_FORMAT(start_time, '%Y-%m-%d') as rental_date, 
               DATE_FORMAT(start_time, '%Y-%m-%d %H:%i:%s') as start_time_str 
        FROM rentals 
        LEFT JOIN ps_units ON rentals.ps_id = ps_units.id
        LEFT JOIN users ON rentals.user_id = users.id
        WHERE rentals.payment_status = 'paid' 
        ORDER BY rentals.start_time DESC
    `;
    db.query(sql, (err, data) => {
        if(err) return res.json({Error: err.sqlMessage});
        return res.json(data);
    });
});

// F. UPLOAD BUKTI
router.put('/pay/:id', upload.single('proof'), (req, res) => {
    const id = req.params.id;
    const method = req.body.payment_method;
    const filename = req.file ? req.file.filename : null; 
    const sql = "UPDATE rentals SET payment_method = ?, payment_proof = ?, payment_status = 'pending' WHERE id = ?";
    db.query(sql, [method, filename, id], (err) => {
        if(err) return res.json({Error: "Gagal upload bukti"});
        return res.json({Status: "Success"});
    });
});

// G. VERIFIKASI ADMIN
router.put('/verify/:id', (req, res) => {
    const id = req.params.id;
    const action = req.body.action; 
    let newStatus = action === 'accept' ? 'paid' : 'rejected';
    const sql = "UPDATE rentals SET payment_status = ? WHERE id = ?";
    db.query(sql, [newStatus, id], (err) => {
        if(err) return res.json({Error: "Gagal verifikasi"});
        return res.json({Status: "Success"});
    });
});

// H. STOP RENTAL MANUAL (UPDATE PENTING)
router.put('/finish/:id', (req, res) => {
    const id = req.params.id;
    // Set status jadi finished & end_time jadi SEKARANG (agar slot langsung terbuka)
    db.query("UPDATE rentals SET status='finished', end_time=NOW() WHERE id=?", [id], (err) => {
        if(err) return res.json({Error: "Gagal"});
        // Kita juga bisa set ps_units jadi available (opsional tapi bagus)
        // db.query("UPDATE ps_units SET status='available' ...") 
        return res.json({Status: "Success"});
    });
});

export default router;