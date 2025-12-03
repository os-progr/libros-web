// ============================================
// INITIALIZE UPLOAD DIRECTORIES
// ============================================
// This script creates necessary upload directories
// Run before starting the server

const fs = require('fs');
const path = require('path');

const uploadDirs = [
    'uploads',
    'uploads/pdfs',
    'uploads/docs',
    'uploads/covers',
    'uploads/others'
];

console.log('🔧 Initializing upload directories...\n');

uploadDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);

    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created: ${dir}`);
    } else {
        console.log(`✓ Exists: ${dir}`);
    }
});

console.log('\n✅ Upload directories initialized successfully!\n');
