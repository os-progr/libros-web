// ============================================
// NOTIFICATIONS ROUTES
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const notifications = await db.query(`
            SELECT * FROM notifications 
            WHERE user_id = ? AND is_read = FALSE
            ORDER BY created_at DESC
            LIMIT 50
        `, [req.user.id]);

        // Count unread
        const countResult = await db.query(`
            SELECT COUNT(*) as count 
            FROM notifications 
            WHERE user_id = ? AND is_read = FALSE
        `, [req.user.id]);

        res.json({
            success: true,
            notifications,
            unreadCount: countResult[0] ? countResult[0].count : 0
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener notificaciones'
        });
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', isAuthenticated, async (req, res) => {
    try {
        // Verify ownership
        const [notif] = await db.query('SELECT * FROM notifications WHERE id = ?', [req.params.id]);

        if (notif.length === 0) {
            return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
        }

        if (notif[0].user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [req.params.id]);

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar notificación' });
    }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', isAuthenticated, async (req, res) => {
    try {
        await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar notificaciones' });
    }
});

module.exports = router;
