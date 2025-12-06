-- Migration: Add Reviews and User Profiles
-- Date: 2025-12-05

-- Table for book reviews and ratings
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
);

-- Add bio field to users table for profiles
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN website VARCHAR(255);
ALTER TABLE users ADD COLUMN location VARCHAR(100);

-- Update notifications table to support different types
ALTER TABLE notifications ADD COLUMN notification_type VARCHAR(50) DEFAULT 'admin' COMMENT 'Types: admin, review, follower, author_new_book, system';
ALTER TABLE notifications ADD COLUMN related_id INT COMMENT 'ID of related entity (book_id, review_id, etc)';

-- Create index for better performance (Wrapped in comments or separate blocks? No, just execute. If fails, script handles it)
-- Note: db_update.js handles error 1061 (Duplicate key name) so these are safe to run repeatedly.
CREATE INDEX idx_reviews_book ON reviews(book_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
