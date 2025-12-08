// ============================================
// EXPRESS SERVER - LIBROS WEB
// ============================================

console.log('🚀 STARTING APP - VERSION 2.0 (DEBUG MODE)');
console.log('📅 Build Time: ' + new Date().toISOString());

// Debug Env Vars
console.log('Environment Debug:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('MYSQLHOST:', process.env.MYSQLHOST);
console.log('MYSQL_URL:', process.env.MYSQL_URL ? 'Set (Hidden)' : 'Not Set');
console.log('DB_PORT:', process.env.DB_PORT);
console.log('MYSQLPORT:', process.env.MYSQLPORT);

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
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const reviewRoutes = require('./routes/reviews');
const profileRoutes = require('./routes/profile');
const libraryRoutes = require('./routes/library');
const socialRoutes = require('./routes/social');
const commentsRoutes = require('./routes/comments');
const chatRoutes = require('./routes/chat');

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
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/chat', chatRoutes);

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// EMERGENCY DB FIX ROUTE
app.get('/fix-db-schema', async (req, res) => {
    try {
        const { testConnection } = require('./config/database');
        const mysql = require('mysql2/promise');
        const dbConfig = {
            host: process.env.MYSQLHOST || process.env.DB_HOST,
            user: process.env.MYSQLUSER || process.env.DB_USER,
            password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
            database: process.env.MYSQLDATABASE || process.env.DB_NAME,
            port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
            multipleStatements: true
        };

        const conn = await mysql.createConnection(dbConfig);

        await conn.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INT PRIMARY KEY AUTO_INCREMENT,
                book_id INT NOT NULL,
                user_id INT NOT NULL,
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                review_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_book_review (user_id, book_id)
            ) ENGINE=InnoDB;
        `);

        // Create Reading Status Table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS reading_status (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                book_id INT NOT NULL,
                status ENUM('want_to_read', 'reading', 'read') NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_book_status (user_id, book_id)
            ) ENGINE=InnoDB;
        `);

        try {
            await conn.query("ALTER TABLE users ADD COLUMN bio TEXT");
        } catch (e) { }
        try {
            await conn.query("ALTER TABLE users ADD COLUMN website VARCHAR(255)");
        } catch (e) { }
        try {
            await conn.query("ALTER TABLE users ADD COLUMN location VARCHAR(100)");
        } catch (e) { }

        await conn.end();
        res.send('<h1>✅ Base de datos reparada correctamente</h1><p>La tabla REVIEWS ha sido creada. Ya puedes usar la aplicación.</p><a href="/">Volver al inicio</a>');
    } catch (error) {
        res.status(500).send(`<h1>❌ Error al reparar DB</h1><pre>${error.message}</pre>`);
    }
});

// FORCE LIBRARY TABLE CREATE ROUTE
app.get('/force-migrate-library', async (req, res) => {
    try {
        const mysql = require('mysql2/promise');
        const dbConfig = {
            host: process.env.MYSQLHOST || process.env.DB_HOST,
            user: process.env.MYSQLUSER || process.env.DB_USER,
            password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
            database: process.env.MYSQLDATABASE || process.env.DB_NAME,
            port: process.env.MYSQLPORT || process.env.DB_PORT || 3306
        };
        const conn = await mysql.createConnection(dbConfig);

        await conn.query(`
            CREATE TABLE IF NOT EXISTS reading_status (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                book_id INT NOT NULL,
                status ENUM('want_to_read', 'reading', 'read') NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_book_status (user_id, book_id)
            ) ENGINE=InnoDB;
        `);

        await conn.end();
        res.send('<h1>✅ Tabla de Biblioteca creada</h1><p>Ya puedes guardar estados de lectura.</p><a href="/">Volver</a>');
    } catch (error) {
        res.status(500).send(`<h1>❌ Error</h1><pre>${error.message}</pre>`);
    }
});

// CLEAR REVIEWS ROUTE
app.get('/reset-reviews', async (req, res) => {
    try {
        const mysql = require('mysql2/promise');
        const dbConfig = {
            host: process.env.MYSQLHOST || process.env.DB_HOST,
            user: process.env.MYSQLUSER || process.env.DB_USER,
            password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
            database: process.env.MYSQLDATABASE || process.env.DB_NAME,
            port: process.env.MYSQLPORT || process.env.DB_PORT || 3306
        };
        const conn = await mysql.createConnection(dbConfig);
        await conn.query('DELETE FROM reviews');
        await conn.query('ALTER TABLE reviews AUTO_INCREMENT = 1');
        await conn.end();
        res.send('<h1>🗑️ Reseñas eliminadas</h1><p>Todas las reseñas han sido borradas.</p><a href="/">Volver</a>');
    } catch (error) {
        res.status(500).send(`<h1>❌ Error</h1><pre>${error.message}</pre>`);
    }
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

        // AUTO-MIGRATION: Ensure reviews table exists (Railway Fix)
        try {
            const mysql = require('mysql2/promise');
            let tempConn;

            // Prefer MYSQL_URL (Connection String) if available
            if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
                console.log('🔄 Usando conexión vía URL para migración...');
                tempConn = await mysql.createConnection(process.env.MYSQL_URL || process.env.DATABASE_URL);
            } else {
                const dbConfig = {
                    host: process.env.MYSQLHOST || process.env.DB_HOST,
                    user: process.env.MYSQLUSER || process.env.DB_USER,
                    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
                    database: process.env.MYSQLDATABASE || process.env.DB_NAME,
                    port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
                    multipleStatements: true
                };
                tempConn = await mysql.createConnection(dbConfig);
            }

            console.log('🔄 Ejecutando migración automática de emergencia...');

            // Create reviews table if not exists with FORCE
            await tempConn.query(`
                CREATE TABLE IF NOT EXISTS reviews (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    book_id INT NOT NULL,
                    user_id INT NOT NULL,
                    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                    review_text TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_user_book_review (user_id, book_id)
                ) ENGINE=InnoDB;
            `);

            // Create Reading Status Table
            await tempConn.query(`
                CREATE TABLE IF NOT EXISTS reading_status (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT NOT NULL,
                    book_id INT NOT NULL,
                    status ENUM('want_to_read', 'reading', 'read') NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_user_book_status (user_id, book_id)
                ) ENGINE=InnoDB;
            `);

            // Add columns to users if they don't exist
            const alterQueries = [
                "ALTER TABLE users ADD COLUMN bio TEXT",
                "ALTER TABLE users ADD COLUMN website VARCHAR(255)",
                "ALTER TABLE users ADD COLUMN location VARCHAR(100)"
            ];

            for (const q of alterQueries) {
                try {
                    await tempConn.query(q);
                } catch (e) {
                    if (e.errno !== 1060) console.log('   (Info migración): ' + e.message);
                }
            }

            console.log('✅ Migración de emergencia completada.');
            await tempConn.end();

        } catch (migErr) {
            console.error('⚠️ Advertencia: Falló lac migración automática:', migErr.message);
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
