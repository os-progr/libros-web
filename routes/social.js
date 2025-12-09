// ============================================
// SOCIAL ROUTES - Follows, Messages, Stats
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

// ============================================
// FOLLOWS (Seguir Autores)
// ============================================

// @route   POST /api/social/follow/:userId
// @desc    Follow a user
// @access  Private
router.post('/follow/:userId', isAuthenticated, async (req, res) => {
    try {
        const followingId = req.params.userId;
        const followerId = req.user.id;

        // Can't follow yourself
        if (followerId == followingId) {
            return res.status(400).json({
                success: false,
                message: 'No puedes seguirte a ti mismo'
            });
        }

        // Check if already following
        const [existing] = await db.query(
            'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya sigues a este usuario'
            });
        }

        // Create follow
        await db.query(
            'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
            [followerId, followingId]
        );

        // Create notification for followed user
        await db.query(
            `INSERT INTO notifications (user_id, title, message, notification_type) 
             VALUES (?, ?, ?, ?)`,
            [followingId, 'Nuevo seguidor', `${req.user.name} comenzó a seguirte`, 'follower']
        );

        res.json({
            success: true,
            message: 'Ahora sigues a este usuario'
        });
    } catch (error) {
        console.error('Error following user:', error);
        res.status(500).json({
            success: false,
            message: 'Error al seguir usuario'
        });
    }
});

// @route   DELETE /api/social/follow/:userId
// @desc    Unfollow a user
// @access  Private
router.delete('/follow/:userId', isAuthenticated, async (req, res) => {
    try {
        const followingId = req.params.userId;
        const followerId = req.user.id;

        await db.query(
            'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );

        res.json({
            success: true,
            message: 'Dejaste de seguir a este usuario'
        });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        res.status(500).json({
            success: false,
            message: 'Error al dejar de seguir'
        });
    }
});

// @route   GET /api/social/followers/:userId
// @desc    Get user's followers
// @access  Private
router.get('/followers/:userId', isAuthenticated, async (req, res) => {
    try {
        const [followers] = await db.query(`
            SELECT u.id, u.name, u.picture, u.bio, f.created_at as followed_at
            FROM follows f
            JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = ?
            ORDER BY f.created_at DESC
        `, [req.params.userId]);

        res.json({
            success: true,
            followers
        });
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener seguidores'
        });
    }
});

// @route   GET /api/social/following/:userId
// @desc    Get users that this user follows
// @access  Private
router.get('/following/:userId', isAuthenticated, async (req, res) => {
    try {
        const [following] = await db.query(`
            SELECT u.id, u.name, u.picture, u.bio, f.created_at as followed_at
            FROM follows f
            JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC
        `, [req.params.userId]);

        res.json({
            success: true,
            following
        });
    } catch (error) {
        console.error('Error fetching following:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener seguidos'
        });
    }
});

// @route   GET /api/social/is-following/:userId
// @desc    Check if current user follows another user
// @access  Private
router.get('/is-following/:userId', isAuthenticated, async (req, res) => {
    try {
        const [result] = await db.query(
            'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?',
            [req.user.id, req.params.userId]
        );

        res.json({
            success: true,
            isFollowing: result.length > 0
        });
    } catch (error) {
        console.error('Error checking follow status:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar seguimiento'
        });
    }
});

// ============================================
// MESSAGES (Mensajería)
// ============================================

// @route   POST /api/social/messages
// @desc    Send a message
// @access  Private
router.post('/messages', isAuthenticated, async (req, res) => {
    try {
        const { receiver_id, message } = req.body;

        if (!receiver_id || !message) {
            return res.status(400).json({
                success: false,
                message: 'Destinatario y mensaje son requeridos'
            });
        }

        // Can't message yourself
        if (req.user.id == receiver_id) {
            return res.status(400).json({
                success: false,
                message: 'No puedes enviarte mensajes a ti mismo'
            });
        }

        await db.query(
            'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
            [req.user.id, receiver_id, message]
        );

        // Create notification
        await db.query(
            `INSERT INTO notifications (user_id, title, message, notification_type) 
             VALUES (?, ?, ?, ?)`,
            [receiver_id, 'Nuevo mensaje', `${req.user.name} te envió un mensaje`, 'message']
        );

        res.json({
            success: true,
            message: 'Mensaje enviado'
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar mensaje'
        });
    }
});

// @route   GET /api/social/messages/:userId
// @desc    Get conversation with a user
// @access  Private
router.get('/messages/:userId', isAuthenticated, async (req, res) => {
    try {
        const otherUserId = req.params.userId;
        const currentUserId = req.user.id;

        const [messages] = await db.query(`
            SELECT m.*, 
                   sender.name as sender_name, 
                   sender.picture as sender_picture
            FROM messages m
            JOIN users sender ON m.sender_id = sender.id
            WHERE (m.sender_id = ? AND m.receiver_id = ?)
               OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.created_at ASC
        `, [currentUserId, otherUserId, otherUserId, currentUserId]);

        // Mark messages as read
        await db.query(
            'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
            [otherUserId, currentUserId]
        );

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener mensajes'
        });
    }
});

// @route   GET /api/social/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/conversations', isAuthenticated, async (req, res) => {
    try {
        const [conversations] = await db.query(`
            SELECT 
                CASE 
                    WHEN m.sender_id = ? THEN m.receiver_id 
                    ELSE m.sender_id 
                END as user_id,
                u.name,
                u.picture,
                MAX(m.created_at) as last_message_at,
                (SELECT message FROM messages m2 
                 WHERE (m2.sender_id = ? AND m2.receiver_id = user_id) 
                    OR (m2.sender_id = user_id AND m2.receiver_id = ?)
                 ORDER BY m2.created_at DESC LIMIT 1) as last_message,
                SUM(CASE WHEN m.receiver_id = ? AND m.is_read = FALSE THEN 1 ELSE 0 END) as unread_count
            FROM messages m
            JOIN users u ON u.id = CASE 
                WHEN m.sender_id = ? THEN m.receiver_id 
                ELSE m.sender_id 
            END
            WHERE m.sender_id = ? OR m.receiver_id = ?
            GROUP BY user_id, u.name, u.picture
            ORDER BY last_message_at DESC
        `, [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]);

        res.json({
            success: true,
            conversations
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        // If table doesn't exist yet, return empty conversations
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.json({
                success: true,
                conversations: []
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error al obtener conversaciones'
        });
    }
});

// @route   GET /api/social/messages/unread/count
// @desc    Get unread messages count
// @access  Private
router.get('/messages/unread/count', isAuthenticated, async (req, res) => {
    try {
        const [result] = await db.query(
            'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE',
            [req.user.id]
        );

        res.json({
            success: true,
            count: result[0].count
        });
    } catch (error) {
        console.error('Error counting unread messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error al contar mensajes'
        });
    }
});

// ============================================
// STATS (Estadísticas Personales)
// ============================================

// @route   GET /api/social/stats/:userId
// @desc    Get user reading statistics
// @access  Private
router.get('/stats/:userId', isAuthenticated, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Books uploaded
        const [booksUploaded] = await db.query(
            'SELECT COUNT(*) as count FROM books WHERE user_id = ?',
            [userId]
        );

        // Books downloaded
        const [booksDownloaded] = await db.query(
            'SELECT COUNT(DISTINCT book_id) as count FROM downloads WHERE user_id = ?',
            [userId]
        );

        // Reviews written
        const [reviewsWritten] = await db.query(
            'SELECT COUNT(*) as count FROM reviews WHERE user_id = ?',
            [userId]
        );

        // Followers count
        const [followersCount] = await db.query(
            'SELECT COUNT(*) as count FROM follows WHERE following_id = ?',
            [userId]
        );

        // Following count
        const [followingCount] = await db.query(
            'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?',
            [userId]
        );

        // Total downloads of user's books
        const [totalDownloads] = await db.query(`
            SELECT COUNT(*) as count 
            FROM downloads d
            JOIN books b ON d.book_id = b.id
            WHERE b.user_id = ?
        `, [userId]);

        // Monthly activity (last 6 months)
        const [monthlyActivity] = await db.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as count
            FROM books
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY month
            ORDER BY month ASC
        `, [userId]);

        res.json({
            success: true,
            stats: {
                booksUploaded: booksUploaded[0].count,
                booksDownloaded: booksDownloaded[0].count,
                reviewsWritten: reviewsWritten[0].count,
                followers: followersCount[0].count,
                following: followingCount[0].count,
                totalDownloads: totalDownloads[0].count,
                monthlyActivity
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        // If tables don't exist yet, return default stats
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.json({
                success: true,
                stats: {
                    booksUploaded: 0,
                    booksDownloaded: 0,
                    reviewsWritten: 0,
                    followers: 0,
                    following: 0,
                    totalDownloads: 0,
                    monthlyActivity: []
                }
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
});

// @route   PUT /api/social/profile
// @desc    Update enhanced profile
// @access  Private
router.put('/profile', isAuthenticated, async (req, res) => {
    try {
        const {
            name,
            bio,
            website,
            location,
            about_me,
            social_twitter,
            social_instagram,
            social_facebook,
            favorite_genres,
            reading_goal_yearly
        } = req.body;

        await db.query(`
            UPDATE users SET
                name = COALESCE(?, name),
                bio = ?,
                website = ?,
                location = ?,
                about_me = ?,
                social_twitter = ?,
                social_instagram = ?,
                social_facebook = ?,
                favorite_genres = ?,
                reading_goal_yearly = ?
            WHERE id = ?
        `, [
            name,
            bio, website, location, about_me,
            social_twitter, social_instagram, social_facebook,
            favorite_genres, reading_goal_yearly,
            req.user.id
        ]);

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar perfil'
        });
    }
});

module.exports = router;
