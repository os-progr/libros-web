// ============================================
// USER PROFILE ROUTES
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

// @route   GET /api/profile/:userId
// @desc    Get user profile with stats
// @access  Public
router.get('/:userId', async (req, res) => {
    try {
        // Get user info
        const [users] = await db.query(`
            SELECT id, name, email, picture, bio, website, location, created_at
            FROM users
            WHERE id = ?
        `, [req.params.userId]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = users[0];

        // Get user's books
        const [books] = await db.query(`
            SELECT 
                b.*,
                COUNT(DISTINCT d.id) as download_count,
                COALESCE(AVG(r.rating), 0) as avg_rating,
                COUNT(DISTINCT r.id) as review_count
            FROM books b
            LEFT JOIN downloads d ON b.id = d.book_id
            LEFT JOIN reviews r ON b.id = r.book_id
            WHERE b.user_id = ?
            GROUP BY b.id
            ORDER BY b.created_at DESC
        `, [req.params.userId]);

        // Get total stats
        const [stats] = await db.query(`
            SELECT 
                COUNT(DISTINCT b.id) as total_books,
                COALESCE(SUM(download_count), 0) as total_downloads
            FROM books b
            LEFT JOIN (
                SELECT book_id, COUNT(*) as download_count
                FROM downloads
                GROUP BY book_id
            ) d ON b.id = d.book_id
            WHERE b.user_id = ?
        `, [req.params.userId]);

        res.json({
            success: true,
            profile: {
                ...user,
                stats: stats[0],
                books
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfil'
        });
    }
});

// @route   PUT /api/profile
// @desc    Update own profile
// @access  Private
router.put('/', isAuthenticated, async (req, res) => {
    try {
        const { bio, website, location } = req.body;

        await db.query(`
            UPDATE users
            SET bio = ?, website = ?, location = ?
            WHERE id = ?
        `, [bio || null, website || null, location || null, req.user.id]);

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
