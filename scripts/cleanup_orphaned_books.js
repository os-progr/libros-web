// ============================================
// CLEANUP ORPHANED BOOKS SCRIPT
// Removes books from database that don't have valid file paths
// ============================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function cleanupOrphanedBooks() {
    console.log('🧹 Iniciando limpieza de registros huérfanos...\n');

    let connection;

    try {
        // Connect to database
        if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
            connection = await mysql.createConnection(process.env.MYSQL_URL || process.env.DATABASE_URL);
        } else {
            connection = await mysql.createConnection({
                host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
                user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
                password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
                database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'libros_web',
                port: process.env.MYSQLPORT || process.env.DB_PORT || 3306
            });
        }

        console.log('✅ Conectado a la base de datos.\n');

        // Find books with local file paths (not Cloudinary URLs)
        const [orphanedBooks] = await connection.query(`
            SELECT id, title, pdf_path, cover_path 
            FROM books 
            WHERE pdf_path NOT LIKE 'https://res.cloudinary.com%'
        `);

        if (orphanedBooks.length === 0) {
            console.log('✨ No se encontraron registros huérfanos. La base de datos está limpia.\n');
            await connection.end();
            return;
        }

        console.log(`📊 Encontrados ${orphanedBooks.length} libros con archivos locales (huérfanos):\n`);

        orphanedBooks.forEach((book, index) => {
            console.log(`   ${index + 1}. "${book.title}" (ID: ${book.id})`);
        });

        console.log('\n🗑️  Eliminando registros huérfanos...\n');

        // Delete orphaned books
        const [result] = await connection.query(`
            DELETE FROM books 
            WHERE pdf_path NOT LIKE 'https://res.cloudinary.com%'
        `);

        console.log(`✅ Eliminados ${result.affectedRows} registros huérfanos exitosamente.\n`);
        console.log('🎉 Limpieza completada. Ahora solo quedan libros con archivos en Cloudinary.\n');

        await connection.end();
    } catch (error) {
        console.error('❌ Error durante la limpieza:', error.message);
        if (connection) await connection.end();
        process.exit(1);
    }
}

// Run cleanup
cleanupOrphanedBooks();
