// ============================================
// SECURITY UTILITIES
// ============================================

const path = require('path');

/**
 * Sanitize file path to prevent path traversal attacks
 * @param {string} filePath - The file path to sanitize
 * @returns {string} - Sanitized file path
 * @throws {Error} - If path contains dangerous patterns
 */
function sanitizeFilePath(filePath) {
    if (!filePath) {
        throw new Error('File path is required');
    }

    // Normalize the path
    const normalized = path.normalize(filePath);

    // Check for path traversal attempts
    if (normalized.includes('..')) {
        throw new Error('Invalid file path: path traversal detected');
    }

    // Check for absolute paths (should be relative)
    if (path.isAbsolute(normalized)) {
        throw new Error('Invalid file path: absolute paths not allowed');
    }

    // Additional security: ensure it starts with expected directories
    const allowedPrefixes = ['uploads/', 'uploads\\'];
    const hasValidPrefix = allowedPrefixes.some(prefix => normalized.startsWith(prefix));

    if (!hasValidPrefix && !normalized.startsWith('http')) {
        throw new Error('Invalid file path: must be in uploads directory or remote URL');
    }

    return normalized;
}

/**
 * Sanitize filename to prevent injection attacks
 * @param {string} filename - The filename to sanitize
 * @returns {string} - Sanitized filename
 */
function sanitizeFilename(filename) {
    if (!filename) {
        throw new Error('Filename is required');
    }

    // Remove any path separators
    let sanitized = filename.replace(/[\/\\]/g, '_');

    // Remove or replace dangerous characters, keep only alphanumeric, spaces, dots, hyphens, underscores
    sanitized = sanitized.replace(/[^a-zA-Z0-9\s.\-_]/g, '_');

    // Limit length
    if (sanitized.length > 255) {
        const ext = path.extname(sanitized);
        const name = path.basename(sanitized, ext);
        sanitized = name.substring(0, 255 - ext.length) + ext;
    }

    return sanitized;
}

/**
 * Validate that a URL is from an allowed domain (e.g., Cloudinary)
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if URL is from allowed domain
 */
function isAllowedRemoteUrl(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }

    const allowedDomains = [
        'cloudinary.com',
        'res.cloudinary.com'
    ];

    try {
        const urlObj = new URL(url);
        return allowedDomains.some(domain => urlObj.hostname.includes(domain));
    } catch (error) {
        return false;
    }
}

module.exports = {
    sanitizeFilePath,
    sanitizeFilename,
    isAllowedRemoteUrl
};
