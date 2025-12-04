// ============================================
// POLL ROUTES
// ============================================

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { pollQueries, genreQueries } = require('../config/database');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: 'Acceso denegado'
    });
};

// @route   GET /api/polls
// @desc    Get all active polls with options
// @access  Private
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const polls = await pollQueries.findActive();

        for (const poll of polls) {
            poll.options = await pollQueries.getOptions(poll.id);
            poll.hasVoted = await pollQueries.hasVoted(poll.id, req.user.id);
        }

        res.json({
            success: true,
            polls
        });
    } catch (error) {
        console.error('Error fetching polls:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener encuestas'
        });
    }
});

// @route   POST /api/polls/:id/vote
// @desc    Vote in a poll
// @access  Private
router.post('/:id/vote', isAuthenticated, async (req, res) => {
    try {
        const { optionId } = req.body;
        const pollId = req.params.id;

        // Check if already voted
        const hasVoted = await pollQueries.hasVoted(pollId, req.user.id);
        if (hasVoted) {
            return res.status(400).json({
                success: false,
                message: 'Ya has votado en esta encuesta'
            });
        }

        await pollQueries.vote(pollId, req.user.id, optionId);

        res.json({
            success: true,
            message: 'Voto registrado exitosamente'
        });
    } catch (error) {
        console.error('Error voting:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar voto'
        });
    }
});

// @route   POST /api/polls
// @desc    Create new poll (admin only)
// @access  Private (Admin)
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { question, options, endsAt } = req.body;

        if (!question || !options || options.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere pregunta y al menos 2 opciones'
            });
        }

        const pollId = await pollQueries.create(question, options, endsAt);

        res.status(201).json({
            success: true,
            message: 'Encuesta creada exitosamente',
            pollId
        });
    } catch (error) {
        console.error('Error creating poll:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear encuesta'
        });
    }
});

// @route   GET /api/genres
// @desc    Get all genres
// @access  Private
router.get('/genres', isAuthenticated, async (req, res) => {
    try {
        const genres = await genreQueries.findAll();
        res.json({
            success: true,
            genres
        });
    } catch (error) {
        console.error('Error fetching genres:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener géneros'
        });
    }
});

module.exports = router;
