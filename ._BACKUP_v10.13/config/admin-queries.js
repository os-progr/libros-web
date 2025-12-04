// ============================================
// ADMIN QUERIES - Activity Logs, Reports, Analytics
// ============================================

const { query } = require('./database');
const { userQueries, bookQueries } = require('./database');

// Activity Log queries
const activityLogQueries = {
    create: async (userId, action, entityType = null, entityId = null, details = null, ipAddress = null) => {
        const sql = `
            INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const result = await query(sql, [userId, action, entityType, entityId, details, ipAddress]);
        return result.insertId;
    },
    findRecent: async (limit = 50) => {
        const sql = `
            SELECT al.*, u.name as user_name, u.email as user_email
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT ?
        `;
        return await query(sql, [limit]);
    },
    findByUser: async (userId, limit = 20) => {
        const sql = `
            SELECT * FROM activity_logs
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        `;
        return await query(sql, [userId, limit]);
    }
};

// Content Reports queries
const contentReportQueries = {
    create: async (reporterId, bookId, reason, description = null) => {
        const sql = `
            INSERT INTO content_reports (reporter_id, book_id, reason, description)
            VALUES (?, ?, ?, ?)
        `;
        const result = await query(sql, [reporterId, bookId, reason, description]);
        return result.insertId;
    },
    findPending: async () => {
        const sql = `
            SELECT cr.*, 
                   u.name as reporter_name,
                   b.title as book_title,
                   b.author as book_author
            FROM content_reports cr
            LEFT JOIN users u ON cr.reporter_id = u.id
            LEFT JOIN books b ON cr.book_id = b.id
            WHERE cr.status = 'pending'
            ORDER BY cr.created_at DESC
        `;
        return await query(sql);
    },
    updateStatus: async (reportId, status, reviewedBy) => {
        const sql = `
            UPDATE content_reports
            SET status = ?, reviewed_by = ?, reviewed_at = NOW()
            WHERE id = ?
        `;
        await query(sql, [status, reviewedBy, reportId]);
    },
    getStats: async () => {
        const sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
            FROM content_reports
        `;
        const result = await query(sql);
        return result[0];
    }
};

// Analytics queries
const analyticsQueries = {
    track: async (eventType, userId = null, bookId = null, metadata = null) => {
        const sql = `
            INSERT INTO analytics (event_type, user_id, book_id, metadata)
            VALUES (?, ?, ?, ?)
        `;
        const metadataJson = metadata ? JSON.stringify(metadata) : null;
        await query(sql, [eventType, userId, bookId, metadataJson]);
    },
    getVisitsLast30Days: async () => {
        const sql = `
            SELECT DATE(created_at) as date, COUNT(*) as visits
            FROM analytics
            WHERE event_type = 'PAGE_VIEW'
            AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `;
        return await query(sql);
    },
    getRecentVisits: async (days = 1) => {
        const sql = `
            SELECT COUNT(DISTINCT user_id) as unique_users, COUNT(*) as total_visits
            FROM analytics
            WHERE event_type = 'PAGE_VIEW'
            AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        const result = await query(sql, [days]);
        return result[0];
    },
    getTopBooks: async (limit = 10) => {
        const sql = `
            SELECT b.id, b.title, b.author, COUNT(*) as views
            FROM analytics a
            JOIN books b ON a.book_id = b.id
            WHERE a.event_type = 'BOOK_VIEW'
            AND a.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY b.id, b.title, b.author
            ORDER BY views DESC
            LIMIT ?
        `;
        return await query(sql, [limit]);
    }
};

// Admin queries
const adminQueries = {
    flagBook: async (bookId, reason, flaggedBy) => {
        const sql = `
            UPDATE books
            SET is_flagged = TRUE, flag_reason = ?, flagged_at = NOW(), flagged_by = ?
            WHERE id = ?
        `;
        await query(sql, [reason, flaggedBy, bookId]);
    },
    unflagBook: async (bookId) => {
        const sql = `
            UPDATE books
            SET is_flagged = FALSE, flag_reason = NULL, flagged_at = NULL, flagged_by = NULL
            WHERE id = ?
        `;
        await query(sql, [bookId]);
    },
    getFlaggedBooks: async () => {
        const sql = `
            SELECT b.*, u.name as flagged_by_name
            FROM books b
            LEFT JOIN users u ON b.flagged_by = u.id
            WHERE b.is_flagged = TRUE
            ORDER BY b.flagged_at DESC
        `;
        return await query(sql);
    },
    getDashboardStats: async () => {
        try {
            const totalUsers = await userQueries.count();
            const totalBooks = await bookQueries.count();
            const recentVisits = await analyticsQueries.getRecentVisits(1);
            const weekVisits = await analyticsQueries.getRecentVisits(7);
            const reportStats = await contentReportQueries.getStats();

            return {
                totalUsers,
                totalBooks,
                todayVisits: recentVisits.total_visits || 0,
                todayUniqueUsers: recentVisits.unique_users || 0,
                weekVisits: weekVisits.total_visits || 0,
                weekUniqueUsers: weekVisits.unique_users || 0,
                pendingReports: reportStats.pending || 0,
                totalReports: reportStats.total || 0
            };
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            return {
                totalUsers: 0,
                totalBooks: 0,
                todayVisits: 0,
                todayUniqueUsers: 0,
                weekVisits: 0,
                weekUniqueUsers: 0,
                pendingReports: 0,
                totalReports: 0
            };
        }
    }
};

module.exports = {
    activityLogQueries,
    contentReportQueries,
    analyticsQueries,
    adminQueries
};
