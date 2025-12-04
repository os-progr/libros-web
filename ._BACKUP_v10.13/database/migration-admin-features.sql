-- ============================================
-- MIGRATION: ADMIN FEATURES
-- Adds activity logs, content moderation, and analytics
-- ============================================

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_action (action)
);

-- Content Reports Table (for spam/inappropriate content)
CREATE TABLE IF NOT EXISTS content_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT NOT NULL,
    book_id INT NOT NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_book_id (book_id)
);

-- Analytics Table (for tracking visits and metrics)
CREATE TABLE IF NOT EXISTS analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id INT,
    book_id INT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL,
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
);

-- Add is_flagged column to books table for moderation
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flag_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS flagged_by INT,
ADD CONSTRAINT fk_flagged_by FOREIGN KEY (flagged_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Log system initialization
INSERT INTO activity_logs (user_id, action, entity_type, details) 
VALUES (1, 'SYSTEM_INIT', 'SYSTEM', 'Admin features migration completed')
ON DUPLICATE KEY UPDATE id=id;
