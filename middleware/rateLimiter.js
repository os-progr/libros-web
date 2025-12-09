// ============================================
// RATE LIMITING MIDDLEWARE
// ============================================

const rateLimit = require('express-rate-limit');

/**
 * Upload rate limiter - Prevents spam uploads
 * Max 20 uploads per hour per IP
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Max 20 uploads per hour
    message: {
        success: false,
        message: 'Límite de subidas alcanzado. Por favor intenta en una hora.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    uploadLimiter
};
