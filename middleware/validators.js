// ============================================
// INPUT VALIDATION MIDDLEWARE
// ============================================

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// ============================================
// BOOK VALIDATORS
// ============================================

/**
 * Validation rules for creating a book
 */
const validateBookCreation = [
    body('title')
        .trim()
        .notEmpty().withMessage('El título es obligatorio')
        .isLength({ min: 1, max: 200 }).withMessage('El título debe tener entre 1 y 200 caracteres')
        .matches(/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑüÜ.,;:¿?¡!\-()'"]+$/).withMessage('El título contiene caracteres no permitidos'),

    body('author')
        .trim()
        .notEmpty().withMessage('El autor es obligatorio')
        .isLength({ min: 1, max: 100 }).withMessage('El autor debe tener entre 1 y 100 caracteres')
        .matches(/^[a-zA-Z\sáéíóúÁÉÍÓÚñÑüÜ.,\-']+$/).withMessage('El nombre del autor contiene caracteres no permitidos'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('La descripción no puede exceder 2000 caracteres'),

    handleValidationErrors
];

/**
 * Validation rules for book ID parameter
 */
const validateBookId = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID de libro inválido')
        .toInt(),

    handleValidationErrors
];

// ============================================
// REVIEW VALIDATORS
// ============================================

/**
 * Validation rules for creating a review
 */
const validateReviewCreation = [
    body('book_id')
        .isInt({ min: 1 }).withMessage('ID de libro inválido')
        .toInt(),

    body('rating')
        .isInt({ min: 1, max: 5 }).withMessage('La calificación debe ser entre 1 y 5')
        .toInt(),

    body('review_text')
        .optional({ checkFalsy: true }) // Allow empty string
        .trim()
        .isLength({ max: 5000 }).withMessage('La reseña no puede exceder 5000 caracteres'),

    handleValidationErrors
];

// ============================================
// COMMENT VALIDATORS
// ============================================

/**
 * Validation rules for creating a comment
 */
const validateCommentCreation = [
    body('book_id')
        .isInt({ min: 1 }).withMessage('ID de libro inválido')
        .toInt(),

    body('comment_text')
        .trim()
        .notEmpty().withMessage('El comentario no puede estar vacío')
        .isLength({ min: 1, max: 1000 }).withMessage('El comentario debe tener entre 1 y 1000 caracteres'),

    body('parent_comment_id')
        .optional()
        .isInt({ min: 1 }).withMessage('ID de comentario padre inválido')
        .toInt(),

    handleValidationErrors
];

/**
 * Validation rules for updating a comment
 */
const validateCommentUpdate = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID de comentario inválido')
        .toInt(),

    body('comment_text')
        .trim()
        .notEmpty().withMessage('El comentario no puede estar vacío')
        .isLength({ min: 1, max: 1000 }).withMessage('El comentario debe tener entre 1 y 1000 caracteres'),

    handleValidationErrors
];

// ============================================
// PROFILE VALIDATORS
// ============================================

/**
 * Validation rules for updating profile
 */
const validateProfileUpdate = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres')
        .matches(/^[a-zA-Z\sáéíóúÁÉÍÓÚñÑüÜ.\-']+$/).withMessage('El nombre contiene caracteres no permitidos'),

    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('La biografía no puede exceder 500 caracteres'),

    body('website')
        .optional()
        .trim()
        .isURL({ require_protocol: true }).withMessage('URL de sitio web inválida')
        .isLength({ max: 255 }).withMessage('La URL es demasiado larga'),

    body('location')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('La ubicación no puede exceder 100 caracteres')
        .matches(/^[a-zA-Z\sáéíóúÁÉÍÓÚñÑüÜ,.\-]+$/).withMessage('La ubicación contiene caracteres no permitidos'),

    handleValidationErrors
];

// ============================================
// MESSAGE VALIDATORS
// ============================================

/**
 * Validation rules for sending a message
 */
const validateMessageCreation = [
    body('receiver_id')
        .isInt({ min: 1 }).withMessage('ID de destinatario inválido')
        .toInt(),

    body('message')
        .trim()
        .notEmpty().withMessage('El mensaje no puede estar vacío')
        .isLength({ min: 1, max: 2000 }).withMessage('El mensaje debe tener entre 1 y 2000 caracteres'),

    handleValidationErrors
];

// ============================================
// ADMIN VALIDATORS
// ============================================

/**
 * Validation rules for admin notification
 */
const validateAdminNotification = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID de usuario inválido')
        .toInt(),

    body('message')
        .trim()
        .notEmpty().withMessage('El mensaje es obligatorio')
        .isLength({ min: 1, max: 1000 }).withMessage('El mensaje debe tener entre 1 y 1000 caracteres'),

    body('title')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('El título no puede exceder 200 caracteres'),

    body('type')
        .optional()
        .isIn(['info', 'warning', 'success', 'error']).withMessage('Tipo de notificación inválido'),

    handleValidationErrors
];

/**
 * Validation rules for admin book update
 */
const validateAdminBookUpdate = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID de libro inválido')
        .toInt(),

    body('title')
        .trim()
        .notEmpty().withMessage('El título es obligatorio')
        .isLength({ min: 1, max: 200 }).withMessage('El título debe tener entre 1 y 200 caracteres'),

    body('author')
        .trim()
        .notEmpty().withMessage('El autor es obligatorio')
        .isLength({ min: 1, max: 100 }).withMessage('El autor debe tener entre 1 y 100 caracteres'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('La descripción no puede exceder 2000 caracteres'),

    handleValidationErrors
];

// ============================================
// QUERY VALIDATORS
// ============================================

/**
 * Validation rules for pagination
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Número de página inválido')
        .toInt(),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Límite debe ser entre 1 y 100')
        .toInt(),

    handleValidationErrors
];

/**
 * Validation rules for search query
 */
const validateSearchQuery = [
    query('q')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 }).withMessage('La búsqueda debe tener entre 1 y 100 caracteres')
        .matches(/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑüÜ.\-]+$/).withMessage('La búsqueda contiene caracteres no permitidos'),

    handleValidationErrors
];

module.exports = {
    // Handlers
    handleValidationErrors,

    // Book validators
    validateBookCreation,
    validateBookId,

    // Review validators
    validateReviewCreation,

    // Comment validators
    validateCommentCreation,
    validateCommentUpdate,

    // Profile validators
    validateProfileUpdate,

    // Message validators
    validateMessageCreation,

    // Admin validators
    validateAdminNotification,
    validateAdminBookUpdate,

    // Query validators
    validatePagination,
    validateSearchQuery
};
