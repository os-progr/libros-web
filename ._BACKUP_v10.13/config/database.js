// ============================================
// DATABASE CONFIGURATION
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
let poolConfig;

if (process.env.MYSQL_URL) {
    // Use MYSQL_URL directly as connection string
    poolConfig = {
        uri: process.env.MYSQL_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
    };
} else {
    // Use individual parameters
    poolConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'libros_web',
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
    };
}

const pool = mysql.createPool(poolConfig);

// Test database connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
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
    },
    // Count total users
    count: async () => {
        const sql = 'SELECT COUNT(*) as total FROM users';
        const result = await query(sql);
        return result[0].total;
    }
};

// Book queries
const bookQueries = {
    // Count total books
    count: async () => {
        const sql = 'SELECT COUNT(*) as total FROM books';
        const result = await query(sql);
        return result[0].total;
    },
    // Get all books (public library)
    findAll: async () => {
        const sql = `
            SELECT books.*, users.name as user_name, users.email as user_email
            FROM books 
            LEFT JOIN users ON books.user_id = users.id
            ORDER BY created_at DESC
        `;
        return await query(sql);
    },

    // Get all books for a user
    findByUserId: async (userId) => {
        const sql = `
            SELECT * FROM books 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `;
        return await query(sql, [userId]);
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
            INSERT INTO books (user_id, title, author, description, genre_id, pdf_path, docx_path, cover_path, allow_download)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await query(sql, [
            bookData.userId,
            bookData.title,
            bookData.author,
            bookData.description || null,
            bookData.genreId || null,
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

    // Admin delete (delete any book by ID)
    deleteById: async (id) => {
        const sql = 'DELETE FROM books WHERE id = ?';
        const result = await query(sql, [id]);
        return result.affectedRows > 0;
    },

    // Check if user owns book
    isOwner: async (bookId, userId) => {
        const sql = 'SELECT id FROM books WHERE id = ? AND user_id = ?';
        const results = await query(sql, [bookId, userId]);
        return results.length > 0;
    }
};


// Genre queries
const genreQueries = {
    findAll: async () => {
        const sql = 'SELECT * FROM genres ORDER BY name ASC';
        return await query(sql);
    },
    findById: async (id) => {
        const sql = 'SELECT * FROM genres WHERE id = ?';
        const results = await query(sql, [id]);
        return results[0];
    }
};

// Poll queries
const pollQueries = {
    findActive: async () => {
        const sql = `
            SELECT p.*, 
                   (SELECT COUNT(*) FROM poll_votes WHERE poll_id = p.id) as total_votes
            FROM polls p 
            WHERE is_active = TRUE 
            AND (ends_at IS NULL OR ends_at > NOW())
            ORDER BY created_at DESC
        `;
        return await query(sql);
    },
    findById: async (id) => {
        const sql = 'SELECT * FROM polls WHERE id = ?';
        const results = await query(sql, [id]);
        return results[0];
    },
    getOptions: async (pollId) => {
        const sql = 'SELECT * FROM poll_options WHERE poll_id = ? ORDER BY id ASC';
        return await query(sql, [pollId]);
    },
    hasVoted: async (pollId, userId) => {
        const sql = 'SELECT id FROM poll_votes WHERE poll_id = ? AND user_id = ?';
        const results = await query(sql, [pollId, userId]);
        return results.length > 0;
    },
    vote: async (pollId, userId, optionId) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.execute(
                'INSERT INTO poll_votes (poll_id, user_id, option_id) VALUES (?, ?, ?)',
                [pollId, userId, optionId]
            );
            await connection.execute(
                'UPDATE poll_options SET votes_count = votes_count + 1 WHERE id = ?',
                [optionId]
            );
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },
    create: async (question, options, endsAt = null) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [result] = await connection.execute(
                'INSERT INTO polls (question, is_active, ends_at) VALUES (?, TRUE, ?)',
                [question, endsAt]
            );
            const pollId = result.insertId;
            for (const option of options) {
                await connection.execute(
                    'INSERT INTO poll_options (poll_id, option_text, votes_count) VALUES (?, ?, 0)',
                    [pollId, option]
                );
            }
            await connection.commit();
            return pollId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = {
    pool,
    testConnection,
    query,
    userQueries,
    bookQueries,
    genreQueries,
    pollQueries
};

