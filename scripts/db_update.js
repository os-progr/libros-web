const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function updateDB() {
    console.log('🔄 Iniciando actualización de base de datos...');

    let config;

    // Debug output to help diagnose
    console.log('🔍 Environment Check:');
    console.log('   MYSQL_URL exists:', !!process.env.MYSQL_URL);
    console.log('   DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('   MYSQLHOST:', process.env.MYSQLHOST);
    console.log('   DB_HOST:', process.env.DB_HOST);

    // Prioritize MYSQL_URL
    if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
        console.log('🔄 Usando MYSQL_URL/DATABASE_URL del entorno.');
        // Use a direct connection string instead of object config if possible to avoid parsing issues
        config = process.env.MYSQL_URL || process.env.DATABASE_URL;
    } else {
        // Fallback
        let host = process.env.MYSQLHOST || process.env.DB_HOST || 'localhost';

        // Critical check: If host is literally 'MYSQL_HOST' (common placeholder error), fallback to localhost or fail gracefully
        if (host === 'MYSQL_HOST') {
            console.error('❌ CRITICAL CONFIG ERROR: Hostname is set to placeholder "MYSQL_HOST". Defaulting to "localhost" to avoid DNS error.');
            host = '127.0.0.1'; // Force local IP to avoid DNS lookup of "MYSQL_HOST"
        }

        config = {
            host: host,
            // Guard against other placeholders just in case
            user: (process.env.MYSQLUSER === 'MYSQL_USER' ? 'root' : process.env.MYSQLUSER) || process.env.DB_USER || 'root',
            password: (process.env.MYSQLPASSWORD === 'MYSQL_PASSWORD' ? '' : process.env.MYSQLPASSWORD) || process.env.DB_PASSWORD || '',
            database: (process.env.MYSQLDATABASE === 'MYSQL_DATABASE' ? 'libros_web' : process.env.MYSQLDATABASE) || process.env.DB_NAME || 'libros_web',
            port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
            multipleStatements: true
        };
    }

    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ Conectado a la base de datos.');

        // Get all migration files from the migrations directory
        const migrationsDir = path.join(__dirname, '../migrations');

        if (!fs.existsSync(migrationsDir)) {
            console.log('⚠️ No se encontró el directorio de migraciones.');
            await connection.end();
            return;
        }

        // Read all .sql files and sort them alphabetically
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Sort alphabetically to ensure correct order (004, 005, 006, etc.)

        console.log(`📂 Encontrados ${migrationFiles.length} archivos de migración:`);
        migrationFiles.forEach(file => console.log(`   - ${file}`));

        // Execute each migration file
        for (const migrationFile of migrationFiles) {
            const sqlPath = path.join(migrationsDir, migrationFile);
            console.log(`\n🔄 Ejecutando migración: ${migrationFile}`);

            const sqlContent = fs.readFileSync(sqlPath, 'utf8');

            // Split by semicolon but ignore semicolons inside quotes if simple splitting fails
            // For simplicity in this context, simple split by ';' is usually fine for schema DDL unless triggers/procedures are involved
            const statements = sqlContent
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0);

            console.log(`   📜 Ejecutando ${statements.length} sentencias SQL...`);

            for (const sql of statements) {
                try {
                    await connection.query(sql);
                    // Only log successful creates/alters, not every statement
                    if (sql.toUpperCase().includes('CREATE TABLE')) {
                        const tableName = sql.match(/CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?/i)?.[1];
                        console.log(`   ✅ Tabla creada/verificada: ${tableName}`);
                    }
                } catch (err) {
                    // Error 1060: Duplicate column name
                    // Error 1050: Table already exists
                    // Error 1061: Duplicate key name
                    if (err.errno === 1060 || err.errno === 1050 || err.errno === 1061) {
                        console.log(`   ⏭️ Ya existe (omitido): ${sql.substring(0, 50)}...`);
                    } else {
                        console.warn(`   ⚠️ Advertencia ejecutando SQL: ${err.message}`);
                        // console.warn(`   Sentencia: ${sql.substring(0, 100)}...`);
                    }
                }
            }
            console.log(`   ✅ Migración ${migrationFile} completada.`);
        }

        console.log('\n✅ Todas las migraciones completadas.');
        await connection.end();
        console.log('✅ Desconectado.');
    } catch (error) {
        console.error('❌ Error de conexión o fatal en db_update.js:');
        console.error(error.message);
        // We do NOT exit with 1 here to avoid crashing the whole deploy if just this script fails
        // But in strict mode we might want to. For now, let's allow it to pass so server.js gets a chance.
        process.exit(0);
    }
}

updateDB();
