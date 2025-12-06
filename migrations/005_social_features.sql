-- ============================================
-- MIGRATION: Social Features & Enhanced Profiles
-- Date: 2025-12-05
-- Features: Follows, Messaging, Enhanced Profiles, Stats
-- ============================================

-- Table for user follows (seguir autores)
CREATE TABLE IF NOT EXISTS follows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_id, following_id),
    INDEX idx_follower (follower_id),
    INDEX idx_following (following_id)
) ENGINE=InnoDB;

-- Table for direct messages
CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_conversation (sender_id, receiver_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- Table for reading stats
CREATE TABLE IF NOT EXISTS reading_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP NULL,
    reading_time_minutes INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_user_stats (user_id),
    INDEX idx_book_stats (book_id)
) ENGINE=InnoDB;

-- Enhance users table with profile fields
ALTER TABLE users ADD COLUMN banner_url VARCHAR(500) COMMENT 'Profile banner image URL';
ALTER TABLE users ADD COLUMN social_twitter VARCHAR(100) COMMENT 'Twitter handle';
ALTER TABLE users ADD COLUMN social_instagram VARCHAR(100) COMMENT 'Instagram handle';
ALTER TABLE users ADD COLUMN social_facebook VARCHAR(100) COMMENT 'Facebook profile';
ALTER TABLE users ADD COLUMN about_me TEXT COMMENT 'Extended bio/about section';
ALTER TABLE users ADD COLUMN favorite_genres VARCHAR(255) COMMENT 'Comma-separated favorite genres';
ALTER TABLE users ADD COLUMN reading_goal_yearly INT DEFAULT 0 COMMENT 'Yearly reading goal';

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_books_user ON books(user_id);
CREATE INDEX idx_books_created ON books(created_at);
