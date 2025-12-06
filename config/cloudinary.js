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

// Helper function to upload file to Cloudinary
async function uploadToCloudinary(filePath, folder, resourceType = 'auto') {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: `libros-web/${folder}`,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true
        });
        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Helper function to delete file from Cloudinary
async function deleteFromCloudinary(publicId, resourceType = 'image') {
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        return { success: true };
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    cloudinary,
    uploadToCloudinary,
    deleteFromCloudinary
};
