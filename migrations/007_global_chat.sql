-- ============================================
-- MIGRATION: Global Public Chat
-- Date: 2025-12-08
-- Features: Public chat room for all users
-- ============================================

-- Table for global public messages
CREATE TABLE IF NOT EXISTS global_chat (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_created (created_at DESC)
) ENGINE=InnoDB;
