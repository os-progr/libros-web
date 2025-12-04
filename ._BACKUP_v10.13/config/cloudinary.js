// ============================================
// CLOUDINARY CONFIGURATION
// ============================================

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('☁️ Cloudinary Configuration:');
if (process.env.CLOUDINARY_CLOUD_NAME) {
    console.log('   ✓ Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
} else {
    console.log('   ⚠️ Warning: CLOUDINARY_CLOUD_NAME not set - file uploads will fail');
}

module.exports = cloudinary;
