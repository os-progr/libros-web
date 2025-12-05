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
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📜 Ejecutando script SQL...');
        await connection.query(sql);

        console.log('✅ ¡Base de datos actualizada correctamente!');
        console.log('   - Tablas de reseñas creadas/verificadas.');
        console.log('   - Columnas de perfil agregadas.');

        await connection.end();
    } catch (error) {
        console.error('❌ Error actualizando la base de datos:');
        console.error(error.message);
        console.log('\n⚠️ SI TIENES PASSWORD EN TU BASE DE DATOS:');
        console.log('   Asegúrate de ponerlo en el archivo .env en la variable DB_PASSWORD');
    }
}

updateDB();
