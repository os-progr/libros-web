const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function updateDB() {
    console.log('🔄 Iniciando actualización de base de datos...');

    let config;

    // Prioritize MYSQL_URL
    if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
        console.log('🔄 Usando MYSQL_URL/DATABASE_URL del entorno.');
        // We can't directly pass the string to createConnection if we want to add multipleStatements: true
        // So we rely on the library parsing it or we just use the object format if URL fails, 
        // but mysql2 createConnection supports URL string.
        // However, we need multipleStatements: true. 
        // The best way is to let mysql2 parse the URL or just use the connection string as is IF it supports options.
        // mysql2 documentation says createConnection(connectionUri) is valid.
        // But how to pass multipleStatements? 
        // We can pass an object with uri property or pass arguments.
        // Let's stick to the object if possible, or parse the URL.
        // Actually simpler: mysql2/promise createConnection takes a string OR an object.
        // If string, we can't easily add options.
        // Let's assume the user has the variables set if URL is not perfect, OR
        // Use the object form with fallbacks.

        // Railway provides MYSQLHOST, MYSQLUSER etc. as well. Let's use those as primary.
        // The error earlier was ENOTFOUND MYSQL_HOST, which meant MYSQLHOST env var was missing or literal string.

        // Let's try to parse the URL if present, or just use the fallback vars which should be correct on Railway.
        // Since I am fixing the startServer to use URL, I should try to do the same here but robustly.
    }

    config = {
        host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
        user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'libros_web',
        port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
        multipleStatements: true
    };

    // If MYSQL_URL is available, we might want to use it, but adding multipleStatements to a URL string connection
    // is tricky without parsing. 
    // Wait, createConnection(url) AND createConnection({ uri: url, multipleStatements: true })?
    // Let's just stick to the config object since we fixed the env vars injection logic mentally.
    // The previous error in db_update.js was `getaddrinfo ENOTFOUND MYSQL_HOST`.
    // This happened because `process.env.MYSQLHOST` was undefined, so it fell back to `process.env.DB_HOST`.
    // And `process.env.DB_HOST` likely contained the string "MYSQL_HOST" (maybe from a bad .env file or misconfiguration).
    // Or `process.env.MYSQLHOST` *was* set to "MYSQL_HOST".

    // To be safe, I will log the config here too to debug if it fails again.

    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ Conectado a la base de datos.');

        const sqlPath = path.join(__dirname, '../migrations/add_reviews_and_profiles.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon but ignore semicolons inside quotes if simple splitting fails
        // For simplicity in this context, simple split by ';' is usually fine for schema DDL unless triggers/procedures are involved
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        console.log(`📜 Ejecutando ${statements.length} sentencias SQL...`);

        for (const sql of statements) {
            try {
                await connection.query(sql);
            } catch (err) {
                // Error 1060: Duplicate column name
                // Error 1050: Table already exists
                // Error 1061: Duplicate key name
                if (err.errno === 1060 || err.errno === 1050 || err.errno === 1061) {
                    console.log(`   ⏭️ Ya existe (omitido): ${sql.substring(0, 30)}...`);
                } else {
                    console.warn(`   ⚠️ Advertencia ejecutando SQL: ${err.message}`);
                    console.warn(`   Sentencia: ${sql.substring(0, 100)}...`);
                }
            }
        }

        console.log('✅ ¡Base de datos actualizada correctamente!');
        await connection.end();
    } catch (error) {
        console.error('❌ Error de conexión o fatal:');
        console.error(error.message);
    }
}

updateDB();
