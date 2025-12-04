-- ============================================
-- MIGRATION: Add Genres, Polls, and Votes
-- ============================================

USE libros_web;

-- ============================================
-- GENRES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS genres (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) NOT NULL, -- Hex color code
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default genres with colors
INSERT INTO genres (name, color) VALUES
    ('Ciencia Ficción', '#3B82F6'),  -- Blue
    ('Thriller', '#EF4444'),          -- Red
    ('Clásicos', '#10B981'),          -- Green
    ('Romance', '#EC4899'),           -- Pink
    ('Fantasía', '#8B5CF6'),          -- Purple
    ('Terror', '#1F2937'),            -- Dark Gray
    ('Autobiografía', '#F59E0B'),     -- Orange
    ('Historia', '#14B8A6'),          -- Teal
    ('Poesía', '#A855F7'),            -- Light Purple
    ('Otro', '#6B7280')               -- Gray
ON DUPLICATE KEY UPDATE name=name;

-- Add genre_id to books table
ALTER TABLE books 
ADD COLUMN genre_id INT DEFAULT NULL AFTER description,
ADD FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE SET NULL,
ADD INDEX idx_genre_id (genre_id);

-- Add docx_path column if it doesn't exist
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS docx_path VARCHAR(500) DEFAULT NULL AFTER pdf_path;

-- ============================================
-- POLLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS polls (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMP NULL,
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- POLL OPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS poll_options (
    id INT PRIMARY KEY AUTO_INCREMENT,
    poll_id INT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    votes_count INT DEFAULT 0,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    INDEX idx_poll_id (poll_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- POLL VOTES TABLE (to track who voted)
-- ============================================
CREATE TABLE IF NOT EXISTS poll_votes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    poll_id INT NOT NULL,
    user_id INT NOT NULL,
    option_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote (poll_id, user_id),
    INDEX idx_poll_user (poll_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample poll
INSERT INTO polls (question, is_active, ends_at) VALUES
    ('¿Cuál es tu género literario favorito?', TRUE, DATE_ADD(NOW(), INTERVAL 30 DAY));

SET @poll_id = LAST_INSERT_ID();

INSERT INTO poll_options (poll_id, option_text) VALUES
    (@poll_id, 'Ciencia Ficción'),
    (@poll_id, 'Thriller'),
    (@poll_id, 'Romance'),
    (@poll_id, 'Fantasía'),
    (@poll_id, 'Clásicos');
