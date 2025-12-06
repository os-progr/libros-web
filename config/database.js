// ============================================
// DATABASE CONFIGURATION
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool(
    process.env.MYSQL_URL || {
        host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
        user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'libros_web',
        port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
    }
);

// Test database connection and initialize tables
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');

        // Initialize Notifications Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT,
                type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Notifications table initialized');

        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Database query helper with error handling
async function query(sql, params) {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// User queries
const userQueries = {
    // Find user by Google ID
    findByGoogleId: async (googleId) => {
        const sql = 'SELECT * FROM users WHERE google_id = ?';
        const results = await query(sql, [googleId]);
        return results[0];
    },

    // Find user by ID
    findById: async (id) => {
        const sql = 'SELECT * FROM users WHERE id = ?';
        const results = await query(sql, [id]);
        return results[0];
    },

    // Create new user
    create: async (userData) => {
        const sql = `
            INSERT INTO users (google_id, email, name, picture)
            VALUES (?, ?, ?, ?)
        `;
        const result = await query(sql, [
            userData.googleId,
            userData.email,
            userData.name,
            userData.picture
        ]);
        return result.insertId;
    },

    // Update user
    update: async (googleId, userData) => {
        const sql = `
            UPDATE users 
            SET email = ?, name = ?, picture = ?
            WHERE google_id = ?
        `;
        await query(sql, [
            userData.email,
            userData.name,
            userData.picture,
            googleId
        ]);
    }
};

// Book queries
const bookQueries = {
    // Get all books for a user
    findByUserId: async (userId) => {
        const sql = `
            SELECT * FROM books 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `;
        return await query(sql, [userId]);
    },

    // Get all books (for public feed)
    findAll: async () => {
        const sql = `
            SELECT books.*, users.name as author_name 
            FROM books 
            LEFT JOIN users ON books.user_id = users.id 
            ORDER BY created_at DESC
        `;
        return await query(sql);
    },

    // Get book by ID
    findById: async (id) => {
        const sql = 'SELECT * FROM books WHERE id = ?';
        const results = await query(sql, [id]);
        return results[0];
    },

    // Create new book
    create: async (bookData) => {
        const sql = `
            INSERT INTO books (user_id, title, author, description, pdf_path, docx_path, cover_path, allow_download)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await query(sql, [
            bookData.userId,
            bookData.title,
            bookData.author,
            bookData.description || null,
            bookData.pdfPath,
            bookData.docxPath || null,
            bookData.coverPath || null,
            bookData.allowDownload
        ]);
        return result.insertId;
    },

    // Delete book (only if owned by user)
    delete: async (id, userId) => {
        const sql = 'DELETE FROM books WHERE id = ? AND user_id = ?';
        const result = await query(sql, [id, userId]);
        return result.affectedRows > 0;
    },

    // Check if user owns book
    isOwner: async (bookId, userId) => {
        const sql = 'SELECT id FROM books WHERE id = ? AND user_id = ?';
        const results = await query(sql, [bookId, userId]);
        return results.length > 0;
    }
};

module.exports = {
    pool,
    testConnection,
    query,
    userQueries,
    bookQueries
};
