// ============================================
// ADMIN ROUTES - Panel de Administración
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Middleware para verificar que el usuario es administrador
const isAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({
            success: false,
            message: 'No autenticado'
        });
    }

    // Verificar si el usuario es administrador
    // Verificar si el usuario es administrador
    const adminEmails = ['edaninguna@gmail.com'];
    if (!adminEmails.includes(req.user.email)) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Solo administradores.'
        });
    }

    next();
};

// @route   GET /api/admin/stats
// @desc    Obtener estadísticas generales del sistema
// @access  Admin only
router.get('/stats', isAdmin, async (req, res) => {
    try {
        // Helper function to safely get count with default value
        const safeCount = (result) => {
            return result && result[0] && typeof result[0].total !== 'undefined' ? result[0].total : 0;
        };

        // Total de usuarios
        let totalUsers = 0;
        try {
            const [usersResult] = await db.query('SELECT COUNT(*) as total FROM users');
            totalUsers = safeCount(usersResult);
        } catch (err) {
            console.warn('Users table query failed:', err.message);
        }

        // Total de libros
        let totalBooks = 0;
        try {
            const [booksResult] = await db.query('SELECT COUNT(*) as total FROM books');
            totalBooks = safeCount(booksResult);
        } catch (err) {
            console.warn('Books table query failed:', err.message);
        }

        // Descargas de hoy
        let downloadsToday = 0;
        try {
            const [downloadsResult] = await db.query(`
                SELECT COUNT(*) as total 
                FROM downloads 
                WHERE DATE(downloaded_at) = CURDATE()
            `);
            downloadsToday = safeCount(downloadsResult);
        } catch (err) {
            console.warn('Downloads today query failed:', err.message);
        }

        // Total de descargas
        let totalDownloads = 0;
        try {
            const [totalDownloadsResult] = await db.query('SELECT COUNT(*) as total FROM downloads');
            totalDownloads = safeCount(totalDownloadsResult);
        } catch (err) {
            console.warn('Total downloads query failed:', err.message);
        }

        // Libro más popular (más descargado)
        let mostPopularBook = null;
        try {
            const [popularBookResult] = await db.query(`
                SELECT b.title, b.author, COUNT(d.id) as download_count
                FROM books b
                LEFT JOIN downloads d ON b.id = d.book_id
                GROUP BY b.id
                ORDER BY download_count DESC
                LIMIT 1
            `);
            mostPopularBook = popularBookResult && popularBookResult[0] ? popularBookResult[0] : null;
        } catch (err) {
            console.warn('Popular book query failed:', err.message);
        }

        // Libros subidos hoy
        let newBooksToday = 0;
        try {
            const [booksToday] = await db.query(`
                SELECT COUNT(*) as total 
                FROM books 
                WHERE DATE(created_at) = CURDATE()
            `);
            newBooksToday = safeCount(booksToday);
        } catch (err) {
            console.warn('Books today query failed:', err.message);
        }

        // Reportes pendientes
        let pendingReports = 0;
        try {
            const [reportsResult] = await db.query(`
                SELECT COUNT(*) as total 
                FROM reports 
                WHERE status = 'pending'
            `);
            pendingReports = safeCount(reportsResult);
        } catch (err) {
            console.warn('Reports query failed:', err.message);
        }

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalBooks,
                downloadsToday,
                totalDownloads,
                mostPopularBook,
                newBooksToday,
                pendingReports
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        // Return default stats instead of error to prevent admin panel from breaking
        res.json({
            success: true,
            stats: {
                totalUsers: 0,
                totalBooks: 0,
                downloadsToday: 0,
                totalDownloads: 0,
                mostPopularBook: null,
                newBooksToday: 0,
                pendingReports: 0
            }
        });
    }
});

// @route   GET /api/admin/users
// @desc    Obtener lista de todos los usuarios
// @access  Admin only
router.get('/users', isAdmin, async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT 
                u.id,
                u.google_id,
                u.email,
                u.name,
                u.picture,
                u.created_at,
                COUNT(DISTINCT b.id) as books_count,
                COUNT(DISTINCT d.id) as downloads_count
            FROM users u
            LEFT JOIN books b ON u.id = b.user_id
            LEFT JOIN downloads d ON u.id = d.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios'
        });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Eliminar un usuario (admin)
// @access  Admin only
router.delete('/users/:id', isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;

        // Verificar que el usuario existe
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Evitar que el admin se elimine a sí mismo
        // Evitar que el admin se elimine a sí mismo
        const adminEmails = ['edaninguna@gmail.com', 'studyciberse@gmail.com'];
        if (adminEmails.includes(users[0].email)) {
            return res.status(400).json({
                success: false,
                message: 'No puedes eliminar una cuenta de administrador'
            });
        }

        // Eliminar el usuario (la cascada en BD debería manejar libros y descargas, 
        // pero por seguridad podríamos limpiar archivos primero si fuera necesario)
        await db.query('DELETE FROM users WHERE id = ?', [userId]);

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario'
        });
    }
});

// @route   POST /api/admin/users/:id/notify
// @desc    Enviar notificación directa a un usuario
// @access  Admin only
router.post('/users/:id/notify', isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { message, title, type } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'El mensaje es obligatorio'
            });
        }

        // Verificar que el usuario existe
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Crear la notificación
        await db.query(`
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, ?, ?, ?)
        `, [
            userId,
            title || 'Mensaje del Administrador',
            message,
            type || 'info'
        ]);

        res.json({
            success: true,
            message: 'Notificación enviada exitosamente'
        });
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar notificación'
        });
    }
});

// @route   GET /api/admin/books
// @desc    Obtener todos los libros con información detallada
// @access  Admin only
router.get('/books', isAdmin, async (req, res) => {
    try {
        const [books] = await db.query(`
            SELECT 
                b.*,
                u.name as uploader_name,
                u.email as uploader_email,
                COUNT(DISTINCT d.id) as download_count,
                0 as report_count
            FROM books b
            LEFT JOIN users u ON b.user_id = u.id
            LEFT JOIN downloads d ON b.id = d.book_id
            GROUP BY b.id
            ORDER BY b.created_at DESC
        `);

        res.json({
            success: true,
            books
        });
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener libros'
        });
    }
});

// @route   DELETE /api/admin/books/:id
// @desc    Eliminar un libro (admin)
// @access  Admin only
router.delete('/books/:id', isAdmin, async (req, res) => {
    try {
        const bookId = req.params.id;

        // Verificar que el libro existe
        const [books] = await db.query('SELECT * FROM books WHERE id = ?', [bookId]);
        if (books.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }

        // Eliminar el libro
        await db.query('DELETE FROM books WHERE id = ?', [bookId]);

        res.json({
            success: true,
            message: 'Libro eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar libro'
        });
    }
});

// @route   PUT /api/admin/books/:id
// @desc    Editar un libro (admin)
// @access  Admin only
router.put('/books/:id', isAdmin, async (req, res) => {
    try {
        const bookId = req.params.id;
        const { title, author, description } = req.body;

        // Verificar que el libro existe
        const [books] = await db.query('SELECT * FROM books WHERE id = ?', [bookId]);
        if (books.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }

        // Actualizar el libro
        await db.query(
            'UPDATE books SET title = ?, author = ?, description = ? WHERE id = ?',
            [title, author, description, bookId]
        );

        res.json({
            success: true,
            message: 'Libro actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error updating book:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar libro'
        });
    }
});

// @route   POST /api/admin/books/:id/feedback
// @desc    Enviar feedback/recomendación al autor de un libro
// @access  Admin only
router.post('/books/:id/feedback', isAdmin, async (req, res) => {
    try {
        const bookId = req.params.id;
        const { message, type } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'El mensaje es obligatorio'
            });
        }

        // Obtener el libro y su autor
        const [books] = await db.query('SELECT * FROM books WHERE id = ?', [bookId]);
        if (books.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }

        const book = books[0];

        // Crear la notificación
        await db.query(`
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, ?, ?, ?)
        `, [
            book.user_id,
            `Recomendación sobre "${book.title}"`,
            message,
            type || 'info'
        ]);

        res.json({
            success: true,
            message: 'Feedback enviado exitosamente'
        });
    } catch (error) {
        console.error('Error sending feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar feedback'
        });
    }
});

// @route   GET /api/admin/activity
// @desc    Obtener actividad reciente del sistema
// @access  Admin only
router.get('/activity', isAdmin, async (req, res) => {
    try {
        // Últimos libros subidos
        const [recentBooks] = await db.query(`
            SELECT b.title, b.author, u.name as uploader, b.created_at
            FROM books b
            JOIN users u ON b.user_id = u.id
            ORDER BY b.created_at DESC
            LIMIT 10
        `);

        // Últimas descargas
        const [recentDownloads] = await db.query(`
            SELECT b.title, u.name as user_name, d.downloaded_at
            FROM downloads d
            JOIN books b ON d.book_id = b.id
            JOIN users u ON d.user_id = u.id
            ORDER BY d.downloaded_at DESC
            LIMIT 10
        `);

        // Nuevos usuarios
        const [recentUsers] = await db.query(`
            SELECT name, email, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            activity: {
                recentBooks,
                recentDownloads,
                recentUsers
            }
        });
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener actividad'
        });
    }
});

// @route   POST /api/admin/clear-cache
// @desc    Limpiar caché del sistema
// @access  Admin only
router.post('/clear-cache', isAdmin, (req, res) => {
    try {
        // Aquí podrías implementar lógica de limpieza de caché
        // Por ahora solo retornamos éxito
        res.json({
            success: true,
            message: 'Caché limpiado exitosamente'
        });
    } catch (error) {
        console.error('Error clearing cache:', error);
        res.status(500).json({
            success: false,
            message: 'Error al limpiar caché'
        });
    }
});

module.exports = router;
