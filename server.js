// ============================================
// EXPRESS SERVER - LIBROS WEB
// ============================================

console.log('🚀 STARTING APP - VERSION 2.0 (DEBUG MODE)');
console.log('📅 Build Time: ' + new Date().toISOString());

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('./config/google-auth');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from public directory
app.use(express.static('public'));

// ============================================
// ROUTES
// ============================================

// Authentication routes
app.use('/auth', authRoutes);

// API routes
app.use('/api/books', bookRoutes);

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    // Multer errors
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'El archivo es demasiado grande. Máximo 10MB.'
            });
        }
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor'
    });
});

// ============================================
// SERVER INITIALIZATION
// ============================================

async function startServer() {
    try {
        // Test database connection
        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.error('❌ No se pudo conectar a la base de datos');
            console.error('Por favor verifica tu configuración en el archivo .env');
            process.exit(1);
        }

        // Start server
        app.listen(PORT, () => {
            console.log('\n' + '='.repeat(50));
            console.log('🚀 Servidor LibrosWeb iniciado exitosamente');
            console.log('='.repeat(50));
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📚 Base de datos: ${process.env.DB_NAME || 'libros_web'}`);
            console.log('='.repeat(50) + '\n');
            console.log('💡 Para detener el servidor presiona Ctrl+C\n');
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n👋 Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n👋 Cerrando servidor...');
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;
