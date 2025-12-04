-- ============================================
-- LIBROS WEB DATABASE SCHEMA
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS libros_web CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE libros_web;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_google_id (google_id),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BOOKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS books (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    description TEXT,
    pdf_path VARCHAR(500) NOT NULL,
    cover_path VARCHAR(500),
    allow_download BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SAMPLE QUERIES (for reference)
-- ============================================

-- Get all books for a specific user
-- SELECT * FROM books WHERE user_id = ? ORDER BY created_at DESC;

-- Get user by Google ID
-- SELECT * FROM users WHERE google_id = ?;

-- Insert new book
-- INSERT INTO books (user_id, title, author, description, pdf_path, cover_path, allow_download)
-- VALUES (?, ?, ?, ?, ?, ?, ?);

-- Delete book (only if owned by user)
-- DELETE FROM books WHERE id = ? AND user_id = ?;
