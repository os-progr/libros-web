// ============================================
// SESSION CLEANUP UTILITY
// ============================================
// This script removes orphaned sessions from the database
// Run this when you see "Failed to deserialize user" errors

require('dotenv').config();
const mysql = require('mysql2/promise');

async function cleanupSessions() {
    let connection;

    try {
        // Create database connection
        if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
            console.log('🔄 Connecting via MYSQL_URL...');
            connection = await mysql.createConnection(process.env.MYSQL_URL || process.env.DATABASE_URL);
        } else {
            const dbConfig = {
                host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
                user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
                password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
                database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'libros_web',
                port: process.env.MYSQLPORT || process.env.DB_PORT || 3306
            };
            console.log('🔄 Connecting to database...');
            connection = await mysql.createConnection(dbConfig);
        }

        console.log('✅ Connected to database');

        // Count total sessions before cleanup
        const [beforeCount] = await connection.query('SELECT COUNT(*) as count FROM sessions');
        console.log(`📊 Total sessions before cleanup: ${beforeCount[0].count}`);

        // Delete expired sessions
        const [expiredResult] = await connection.query('DELETE FROM sessions WHERE expires < NOW()');
        console.log(`🗑️  Deleted ${expiredResult.affectedRows} expired sessions`);

        // Find and delete orphaned sessions (sessions with non-existent user IDs)
        const [orphanedResult] = await connection.query(`
            DELETE s FROM sessions s
            LEFT JOIN users u ON JSON_EXTRACT(s.data, '$.passport.user') = u.id
            WHERE JSON_EXTRACT(s.data, '$.passport.user') IS NOT NULL
            AND u.id IS NULL
        `);
        console.log(`🗑️  Deleted ${orphanedResult.affectedRows} orphaned sessions`);

        // Count total sessions after cleanup
        const [afterCount] = await connection.query('SELECT COUNT(*) as count FROM sessions');
        console.log(`📊 Total sessions after cleanup: ${afterCount[0].count}`);

        const totalDeleted = beforeCount[0].count - afterCount[0].count;
        console.log(`\n✅ Cleanup complete! Removed ${totalDeleted} invalid sessions.`);

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
        if (connection) await connection.end();
        process.exit(1);
    }
}

// Run the cleanup
cleanupSessions();
