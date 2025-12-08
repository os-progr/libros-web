// ============================================
// GLOBAL CHAT ROUTES - Public Chat Room
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

// @route   GET /api/chat/messages
// @desc    Get recent global chat messages (last 100)
// @access  Private
router.get('/messages', isAuthenticated, async (req, res) => {
    try {
        const [messages] = await db.query(`
            SELECT 
                gc.id,
                gc.message,
                gc.created_at,
                u.id as user_id,
                u.name as user_name,
                u.picture as user_picture
            FROM global_chat gc
            JOIN users u ON gc.user_id = u.id
            ORDER BY gc.created_at DESC
            LIMIT 100
        `);

        // Reverse to show oldest first
        res.json({
            success: true,
            messages: messages.reverse()
        });
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener mensajes'
        });
    }
});

// @route   POST /api/chat/messages
// @desc    Send a message to global chat
// @access  Private
router.post('/messages', isAuthenticated, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El mensaje no puede estar vacío'
            });
        }

        // Limit message length
        if (message.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'El mensaje es demasiado largo (máximo 500 caracteres)'
            });
        }

        // Insert message
        await db.query(
            'INSERT INTO global_chat (user_id, message) VALUES (?, ?)',
            [req.user.id, message.trim()]
        );

        // Check message count and auto-delete old messages if >= 200
        const [countResult] = await db.query('SELECT COUNT(*) as total FROM global_chat');
        const totalMessages = countResult[0].total;

        if (totalMessages >= 200) {
            // Keep only the most recent 199 messages (200-1)
            await db.query(`
                DELETE FROM global_chat 
                WHERE id NOT IN (
                    SELECT id FROM (
                        SELECT id FROM global_chat 
                        ORDER BY created_at DESC 
                        LIMIT 199
                    ) as keep_messages
                )
            `);
        }

        // Get the newly created message with user info
        const [newMessage] = await db.query(`
            SELECT 
                gc.id,
                gc.message,
                gc.created_at,
                u.id as user_id,
                u.name as user_name,
                u.picture as user_picture
            FROM global_chat gc
            JOIN users u ON gc.user_id = u.id
            WHERE gc.user_id = ? AND gc.message = ?
            ORDER BY gc.created_at DESC
            LIMIT 1
        `, [req.user.id, message.trim()]);

        res.json({
            success: true,
            message: 'Mensaje enviado',
            newMessage: newMessage[0]
        });
    } catch (error) {
        console.error('Error sending chat message:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar mensaje'
        });
    }
});

// @route   GET /api/chat/count
// @desc    Get total message count
// @access  Private
router.get('/count', isAuthenticated, async (req, res) => {
    try {
        const [result] = await db.query('SELECT COUNT(*) as total FROM global_chat');
        res.json({
            success: true,
            count: result[0].total
        });
    } catch (error) {
        console.error('Error getting message count:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener contador'
        });
    }
});

module.exports = router;
