// ============================================
// ADMIN ROUTES - Complete Administration Panel
// ============================================

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { activityLogQueries, contentReportQueries, analyticsQueries, adminQueries } = require('../config/admin-queries');
const { bookQueries } = require('../config/database');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
};

// Log activity helper
async function logActivity(userId, action, entityType = null, entityId = null, details = null, req = null) {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.connection.remoteAddress) : null;
    await activityLogQueries.create(userId, action, entityType, entityId, details, ipAddress);
}

// @route   GET /api/admin/dashboard
// @desc    Get comprehensive dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const stats = await adminQueries.getDashboardStats();

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas del dashboard'
        });
    }
});

// @route   GET /api/admin/activity-logs
// @desc    Get recent activity logs
// @access  Private (Admin only)
router.get('/activity-logs', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const logs = await activityLogQueries.findRecent(limit);

        res.json({
            success: true,
            logs
        });
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el registro de actividades'
        });
    }
});

// @route   GET /api/admin/analytics/visits
// @desc    Get visits for last 30 days
// @access  Private (Admin only)
router.get('/analytics/visits', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const visits = await analyticsQueries.getVisitsLast30Days();

        res.json({
            success: true,
            visits
        });
    } catch (error) {
        console.error('Error fetching visit analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener análisis de visitas'
        });
    }
});

// @route   GET /api/admin/analytics/top-books
// @desc    Get top viewed books
// @access  Private (Admin only)
router.get('/analytics/top-books', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const topBooks = await analyticsQueries.getTopBooks(limit);

        res.json({
            success: true,
            books: topBooks
        });
    } catch (error) {
        console.error('Error fetching top books:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener libros más vistos'
        });
    }
});

// @route   GET /api/admin/reports/pending
// @desc    Get pending content reports
// @access  Private (Admin only)
router.get('/reports/pending', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const reports = await contentReportQueries.findPending();

        res.json({
            success: true,
            reports
        });
    } catch (error) {
        console.error('Error fetching pending reports:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reportes pendientes'
        });
    }
});

// @route   POST /api/admin/reports/:id/resolve
// @desc    Resolve a content report
// @access  Private (Admin only)
router.post('/reports/:id/resolve', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { status } = req.body; // 'resolved' or 'dismissed'
        const reportId = req.params.id;

        await contentReportQueries.updateStatus(reportId, status, req.user.id);
        await logActivity(req.user.id, 'REPORT_RESOLVED', 'REPORT', reportId, `Status: ${status}`, req);

        res.json({
            success: true,
            message: 'Reporte actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error resolving report:', error);
        res.status(500).json({
            success: false,
            message: 'Error al resolver el reporte'
        });
    }
});

// @route   POST /api/admin/books/:id/flag
// @desc    Flag a book as inappropriate
// @access  Private (Admin only)
router.post('/books/:id/flag', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { reason } = req.body;
        const bookId = req.params.id;

        await adminQueries.flagBook(bookId, reason, req.user.id);
        await logActivity(req.user.id, 'BOOK_FLAGGED', 'BOOK', bookId, reason, req);

        res.json({
            success: true,
            message: 'Libro marcado exitosamente'
        });
    } catch (error) {
        console.error('Error flagging book:', error);
        res.status(500).json({
            success: false,
            message: 'Error al marcar el libro'
        });
    }
});

// @route   POST /api/admin/books/:id/unflag
// @desc    Unflag a book
// @access  Private (Admin only)
router.post('/books/:id/unflag', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const bookId = req.params.id;

        await adminQueries.unflagBook(bookId);
        await logActivity(req.user.id, 'BOOK_UNFLAGGED', 'BOOK', bookId, null, req);

        res.json({
            success: true,
            message: 'Libro desmarcado exitosamente'
        });
    } catch (error) {
        console.error('Error unflagging book:', error);
        res.status(500).json({
            success: false,
            message: 'Error al desmarcar el libro'
        });
    }
});

// @route   GET /api/admin/books/flagged
// @desc    Get all flagged books
// @access  Private (Admin only)
router.get('/books/flagged', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const flaggedBooks = await adminQueries.getFlaggedBooks();

        res.json({
            success: true,
            books: flaggedBooks
        });
    } catch (error) {
        console.error('Error fetching flagged books:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener libros marcados'
        });
    }
});

// @route   POST /api/admin/reports/create
// @desc    Create a content report (users can report inappropriate content)
// @access  Private
router.post('/reports/create', isAuthenticated, async (req, res) => {
    try {
        const { bookId, reason, description } = req.body;

        if (!bookId || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere ID del libro y razón del reporte'
            });
        }

        const reportId = await contentReportQueries.create(req.user.id, bookId, reason, description);
        await logActivity(req.user.id, 'REPORT_CREATED', 'BOOK', bookId, reason, req);

        res.status(201).json({
            success: true,
            message: 'Reporte enviado exitosamente',
            reportId
        });
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el reporte'
        });
    }
});

module.exports = router;
