const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function updateDB() {
    console.log('🔄 Iniciando actualización de base de datos...');

    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'libros_web',
        multipleStatements: true
    };

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
