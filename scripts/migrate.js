// ============================================
// DATABASE MIGRATION SCRIPT
// ============================================

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'libros_db',
            multipleStatements: true
        });

        console.log('📦 Conectado a la base de datos');

        // Read migration file
        const migrationPath = path.join(__dirname, '../migrations/add_reviews_and_profiles.sql');
        const sql = await fs.readFile(migrationPath, 'utf8');

        console.log('🔄 Ejecutando migración...');

        // Execute migration
        await connection.query(sql);

        console.log('✅ Migración completada exitosamente');
        console.log('');
        console.log('Tablas y campos agregados:');
        console.log('  - reviews (tabla completa)');
        console.log('  - users.bio');
        console.log('  - users.website');
        console.log('  - users.location');
        console.log('  - notifications.notification_type');
        console.log('  - notifications.related_id');

    } catch (error) {
        console.error('❌ Error en la migración:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();
