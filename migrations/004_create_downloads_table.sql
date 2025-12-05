-- ============================================
-- MIGRATION: Agregar tabla de descargas
-- ============================================

-- Crear tabla de descargas
CREATE TABLE IF NOT EXISTS downloads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_book_id (book_id),
    INDEX idx_downloaded_at (downloaded_at)
);

-- Agregar comentarios
ALTER TABLE downloads COMMENT = 'Registro de descargas de libros por usuarios';
