// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

// Check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({
        success: false,
        message: 'No estás autenticado. Por favor inicia sesión.'
    });
}

// Check if user is the owner of a resource
function isOwner(req, res, next) {
    const userId = req.user.id;
    const resourceUserId = req.resourceUserId; // This should be set by the route handler

    if (userId === resourceUserId) {
        return next();
    }

    res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a este recurso.'
    });
}

module.exports = {
    isAuthenticated,
    isOwner
};
