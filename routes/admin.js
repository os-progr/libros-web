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
    const adminEmail = 'edaninguna@gmail.com';
    if (req.user.email !== adminEmail) {
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
        // Total de usuarios
        const [usersResult] = await db.query('SELECT COUNT(*) as total FROM users');
        const totalUsers = usersResult[0].total;

        // Total de libros
        const [booksResult] = await db.query('SELECT COUNT(*) as total FROM books');
        const totalBooks = booksResult[0].total;

        // Descargas de hoy
        const [downloadsResult] = await db.query(`
            SELECT COUNT(*) as total 
            FROM downloads 
            WHERE DATE(downloaded_at) = CURDATE()
        `);
        const downloadsToday = downloadsResult[0].total;

        // Total de descargas
        const [totalDownloadsResult] = await db.query('SELECT COUNT(*) as total FROM downloads');
        const totalDownloads = totalDownloadsResult[0].total;

        // Libro más popular (más descargado)
        const [popularBookResult] = await db.query(`
            SELECT b.title, b.author, COUNT(d.id) as download_count
            FROM books b
            LEFT JOIN downloads d ON b.id = d.book_id
            GROUP BY b.id
            ORDER BY download_count DESC
            LIMIT 1
        `);
        const mostPopularBook = popularBookResult[0] || null;

        // Libros subidos hoy
        const [booksToday] = await db.query(`
            SELECT COUNT(*) as total 
            FROM books 
            WHERE DATE(created_at) = CURDATE()
        `);
        const newBooksToday = booksToday[0].total;

        // Reportes pendientes
        const [reportsResult] = await db.query(`
            SELECT COUNT(*) as total 
            FROM reports 
            WHERE status = 'pending'
        `);
        const pendingReports = reportsResult[0].total;

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
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
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
                COUNT(DISTINCT r.id) as report_count
            FROM books b
            LEFT JOIN users u ON b.user_id = u.id
            LEFT JOIN downloads d ON b.id = d.book_id
            LEFT JOIN reports r ON b.id = r.book_id
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
