// ============================================
// COMMENTS ROUTES - Comments System
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

// @route   GET /api/comments/book/:bookId
// @desc    Get all comments for a book
// @access  Private
router.get('/book/:bookId', isAuthenticated, async (req, res) => {
    try {
        const bookId = req.params.bookId;

        // Get all comments with user info and like count
        const [comments] = await db.query(`
            SELECT 
                c.*,
                u.name as user_name,
                u.picture as user_picture,
                COUNT(DISTINCT cl.id) as like_count,
                EXISTS(
                    SELECT 1 FROM comment_likes cl2 
                    WHERE cl2.comment_id = c.id AND cl2.user_id = ?
                ) as user_has_liked
            FROM comments c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN comment_likes cl ON c.id = cl.comment_id
            WHERE c.book_id = ?
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `, [req.user.id, bookId]);

        // Organize comments into threads (parent comments with their replies)
        const commentMap = {};
        const rootComments = [];

        comments.forEach(comment => {
            comment.replies = [];
            commentMap[comment.id] = comment;
        });

        comments.forEach(comment => {
            if (comment.parent_comment_id === null) {
                rootComments.push(comment);
            } else {
                const parent = commentMap[comment.parent_comment_id];
                if (parent) {
                    parent.replies.push(comment);
                }
            }
        });

        res.json({
            success: true,
            comments: rootComments
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        // If table doesn't exist yet, return empty comments
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.json({
                success: true,
                comments: []
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error al obtener comentarios'
        });
    }
});

// @route   POST /api/comments
// @desc    Create a new comment
// @access  Private
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { book_id, comment_text, parent_comment_id } = req.body;

        if (!book_id || !comment_text) {
            return res.status(400).json({
                success: false,
                message: 'El libro y el texto del comentario son requeridos'
            });
        }

        // Insert comment
        const [result] = await db.query(
            'INSERT INTO comments (book_id, user_id, parent_comment_id, comment_text) VALUES (?, ?, ?, ?)',
            [book_id, req.user.id, parent_comment_id || null, comment_text]
        );

        // If it's a reply, notify the parent comment author
        if (parent_comment_id) {
            const [parentComment] = await db.query(
                'SELECT user_id FROM comments WHERE id = ?',
                [parent_comment_id]
            );

            if (parentComment.length > 0 && parentComment[0].user_id !== req.user.id) {
                await db.query(
                    `INSERT INTO notifications (user_id, title, message, notification_type) 
                     VALUES (?, ?, ?, ?)`,
                    [
                        parentComment[0].user_id,
                        'Nueva respuesta',
                        `${req.user.name} respondió a tu comentario`,
                        'comment_reply'
                    ]
                );
            }
        } else {
            // If it's a new comment, notify the book author
            const [book] = await db.query(
                'SELECT user_id FROM books WHERE id = ?',
                [book_id]
            );

            if (book.length > 0 && book[0].user_id !== req.user.id) {
                await db.query(
                    `INSERT INTO notifications (user_id, title, message, notification_type) 
                     VALUES (?, ?, ?, ?)`,
                    [
                        book[0].user_id,
                        'Nuevo comentario',
                        `${req.user.name} comentó en tu libro`,
                        'book_comment'
                    ]
                );
            }
        }

        // Get the created comment with user info
        const [newComment] = await db.query(`
            SELECT 
                c.*,
                u.name as user_name,
                u.picture as user_picture,
                0 as like_count,
                FALSE as user_has_liked
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Comentario publicado',
            comment: newComment[0]
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({
            success: false,
            message: 'Error al publicar comentario'
        });
    }
});

// @route   DELETE /api/comments/:id
// @desc    Delete a comment
// @access  Private
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const commentId = req.params.id;

        // Check if comment exists and user owns it or is admin
        const [comments] = await db.query(
            'SELECT * FROM comments WHERE id = ?',
            [commentId]
        );

        if (comments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Comentario no encontrado'
            });
        }

        const comment = comments[0];
        const isAdmin = req.user.email === 'edaninguna@gmail.com';

        if (comment.user_id !== req.user.id && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar este comentario'
            });
        }

        // Delete comment (cascade will delete replies and likes)
        await db.query('DELETE FROM comments WHERE id = ?', [commentId]);

        res.json({
            success: true,
            message: 'Comentario eliminado'
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar comentario'
        });
    }
});

// @route   POST /api/comments/:id/like
// @desc    Like/unlike a comment
// @access  Private
router.post('/:id/like', isAuthenticated, async (req, res) => {
    try {
        const commentId = req.params.id;

        // Check if already liked
        const [existing] = await db.query(
            'SELECT * FROM comment_likes WHERE comment_id = ? AND user_id = ?',
            [commentId, req.user.id]
        );

        if (existing.length > 0) {
            // Unlike
            await db.query(
                'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?',
                [commentId, req.user.id]
            );

            res.json({
                success: true,
                liked: false,
                message: 'Like eliminado'
            });
        } else {
            // Like
            await db.query(
                'INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)',
                [commentId, req.user.id]
            );

            // Notify comment author
            const [comment] = await db.query(
                'SELECT user_id FROM comments WHERE id = ?',
                [commentId]
            );

            if (comment.length > 0 && comment[0].user_id !== req.user.id) {
                await db.query(
                    `INSERT INTO notifications (user_id, title, message, notification_type) 
                     VALUES (?, ?, ?, ?)`,
                    [
                        comment[0].user_id,
                        'Like en comentario',
                        `A ${req.user.name} le gustó tu comentario`,
                        'comment_like'
                    ]
                );
            }

            res.json({
                success: true,
                liked: true,
                message: 'Like agregado'
            });
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({
            success: false,
            message: 'Error al dar like'
        });
    }
});

// @route   PUT /api/comments/:id
// @desc    Edit a comment
// @access  Private
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const commentId = req.params.id;
        const { comment_text } = req.body;

        if (!comment_text) {
            return res.status(400).json({
                success: false,
                message: 'El texto del comentario es requerido'
            });
        }

        // Check if comment exists and user owns it
        const [comments] = await db.query(
            'SELECT * FROM comments WHERE id = ?',
            [commentId]
        );

        if (comments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Comentario no encontrado'
            });
        }

        if (comments[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para editar este comentario'
            });
        }

        // Update comment
        await db.query(
            'UPDATE comments SET comment_text = ? WHERE id = ?',
            [comment_text, commentId]
        );

        res.json({
            success: true,
            message: 'Comentario actualizado'
        });
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar comentario'
        });
    }
});

module.exports = router;
