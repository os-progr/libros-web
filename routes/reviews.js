// ============================================
// REVIEWS ROUTES - Sistema de Valoraciones
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

// @route   GET /api/reviews/book/:bookId
// @desc    Get all reviews for a book
// @access  Public
router.get('/book/:bookId', async (req, res) => {
    try {
        const [reviews] = await db.query(`
            SELECT 
                r.*,
                u.name as user_name,
                u.picture as user_picture
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.book_id = ?
            ORDER BY r.created_at DESC
        `, [req.params.bookId]);

        // Get average rating
        const [avgResult] = await db.query(`
            SELECT 
                AVG(rating) as avg_rating,
                COUNT(*) as total_reviews
            FROM reviews
            WHERE book_id = ?
        `, [req.params.bookId]);

        res.json({
            success: true,
            reviews,
            stats: {
                average: avgResult[0].avg_rating || 0,
                total: avgResult[0].total_reviews || 0
            }
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reseñas'
        });
    }
});

// @route   POST /api/reviews
// @desc    Create or update a review
// @access  Private
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { book_id, rating, review_text } = req.body;

        if (!book_id || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Book ID y calificación son obligatorios'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'La calificación debe estar entre 1 y 5'
            });
        }

        // Check if book exists
        const [books] = await db.query('SELECT * FROM books WHERE id = ?', [book_id]);
        if (books.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }

        // Insert or update review
        await db.query(`
            INSERT INTO reviews (book_id, user_id, rating, review_text)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                rating = VALUES(rating),
                review_text = VALUES(review_text),
                updated_at = CURRENT_TIMESTAMP
        `, [book_id, req.user.id, rating, review_text]);

        // Notify book author about new review
        const book = books[0];
        if (book.user_id !== req.user.id) {
            try {
                await db.query(`
                    INSERT INTO notifications (user_id, title, message, type, notification_type, related_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    book.user_id,
                    'Nueva reseña en tu libro',
                    `${req.user.name} dejó una reseña de ${rating} estrellas en "${book.title}"`,
                    'info',
                    'review',
                    book_id
                ]);
            } catch (notifyError) {
                console.error('Error sending review notification (non-critical):', notifyError);
            }
        }

        res.json({
            success: true,
            message: 'Reseña guardada exitosamente'
        });
    } catch (error) {
        console.error('Error saving review:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar reseña: ' + error.message // Expose error for debugging
        });
    }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private (own reviews only)
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const [reviews] = await db.query('SELECT * FROM reviews WHERE id = ?', [req.params.id]);

        if (reviews.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reseña no encontrada'
            });
        }

        // Check ownership
        if (reviews[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar esta reseña'
            });
        }

        await db.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);

        res.json({
            success: true,
            message: 'Reseña eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar reseña'
        });
    }
});

// @route   GET /api/reviews/user/:userId
// @desc    Get all reviews by a user
// @access  Public
router.get('/user/:userId', async (req, res) => {
    try {
        const [reviews] = await db.query(`
            SELECT 
                r.*,
                b.title as book_title,
                b.author as book_author
            FROM reviews r
            JOIN books b ON r.book_id = b.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        `, [req.params.userId]);

        res.json({
            success: true,
            reviews
        });
    } catch (error) {
        console.error('Error fetching user reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reseñas del usuario'
        });
    }
});

module.exports = router;
