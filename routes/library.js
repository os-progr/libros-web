const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Update reading status
router.post('/status', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }

        const { bookId, status } = req.body;
        const validStatuses = ['want_to_read', 'reading', 'read'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Estado inválido' });
        }

        // Upsert status
        await db.query(`
            INSERT INTO reading_status (user_id, book_id, status)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE status = ?
        `, [req.user.id, bookId, status, status]);

        res.json({ success: true, message: 'Estado actualizado' });
    } catch (error) {
        console.error('Error updating reading status:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar estado' });
    }
});

// Get user's reading statuses
router.get('/my-status', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }

        const results = await db.query(`
            SELECT book_id, status FROM reading_status WHERE user_id = ?
        `, [req.user.id]);

        // Convert to map for easy frontend lookup
        const statusMap = {};
        results.forEach(row => {
            statusMap[row.book_id] = row.status;
        });

        res.json({ success: true, statuses: statusMap });
    } catch (error) {
        console.error('Error getting reading statuses:', error);
        res.status(500).json({ success: false, message: 'Error al obtener estados' });
    }
});

module.exports = router;
