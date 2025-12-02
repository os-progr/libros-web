// ============================================
// AUTHENTICATION ROUTES
// ============================================

const express = require('express');
const router = express.Router();
const passport = require('../config/passport');

// @route   GET /auth/google
// @desc    Initiate Google OAuth flow
// @access  Public
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

// @route   GET /auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/?error=auth_failed'
    }),
    (req, res) => {
        // Successful authentication, redirect to home
        res.redirect('/');
    }
);

// @route   GET /auth/user
// @desc    Get current authenticated user
// @access  Private
router.get('/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            success: true,
            user: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                picture: req.user.picture
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'No autenticado'
        });
    }
});

// @route   GET /auth/logout
// @desc    Logout user
// @access  Private
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al cerrar sesión'
            });
        }
        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });
    });
});

module.exports = router;
