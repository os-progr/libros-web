// ============================================
// BOOK API ROUTES WITH CLOUDINARY
// ============================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { isAuthenticated } = require('../middleware/auth');
const { bookQueries } = require('../config/database');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'pdf') {
            if (file.mimetype === 'application/pdf') {
                cb(null, true);
            } else {
                cb(new Error('Solo se permiten archivos PDF'));
            }
        } else if (file.fieldname === 'docx') {
            if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.mimetype === 'application/msword') {
                cb(null, true);
            } else {
                cb(new Error('Solo se permiten archivos Word (.doc, .docx)'));
            }
        } else if (file.fieldname === 'cover') {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Solo se permiten imágenes'));
            }
        } else {
            cb(null, true);
        }
    }
});

// Helper function to upload buffer to Cloudinary
function uploadToCloudinary(buffer, folder, resourceType = 'auto') {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: resourceType,
                folder: `libros-web/${folder}`,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
}

// @route   GET /api/books
// @desc    Get all books (public library)
// @access  Private
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const books = await bookQueries.findAll();
        const booksWithOwnership = books.map(book => ({
            ...book,
            isOwner: book.user_id === req.user.id,
            isAdmin: req.user.isAdmin
        }));
        res.json({
            success: true,
            books: booksWithOwnership
        });
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los libros'
        });
    }
});

// @route   POST /api/books
// @desc    Upload a new book
// @access  Private
router.post('/',
    isAuthenticated,
    upload.fields([
        { name: 'pdf', maxCount: 1 },
        { name: 'docx', maxCount: 1 },
        { name: 'cover', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const { title, author, description, genre_id } = req.body;

            if (!title || !author || !req.files?.pdf) {
                return res.status(400).json({
                    success: false,
                    message: 'Título, autor y archivo PDF son obligatorios'
                });
            }

            // Upload PDF to Cloudinary
            const pdfResult = await uploadToCloudinary(req.files.pdf[0].buffer, 'pdfs', 'raw');
            let docxUrl = null;
            let coverUrl = null;

            // Upload DOCX if provided
            if (req.files.docx) {
                const docxResult = await uploadToCloudinary(req.files.docx[0].buffer, 'docs', 'raw');
                docxUrl = docxResult.secure_url;
            }

            // Upload cover if provided
            if (req.files.cover) {
                const coverResult = await uploadToCloudinary(req.files.cover[0].buffer, 'covers', 'image');
                coverUrl = coverResult.secure_url;
            }

            // Create book in database
            const bookId = await bookQueries.create({
                userId: req.user.id,
                title,
                author,
                description,
                genreId: genre_id || null,
                pdfPath: pdfResult.secure_url,
                docxPath: docxUrl,
                coverPath: coverUrl,
                allowDownload: true
            });

            const book = await bookQueries.findById(bookId);

            res.status(201).json({
                success: true,
                message: 'Libro publicado exitosamente',
                book: book
            });
        } catch (error) {
            console.error('Error uploading book:', error);
            res.status(500).json({
                success: false,
                message: 'Error al publicar el libro'
            });
        }
    }
);

// @route   GET /api/books/:id
// @desc    Get a specific book
// @access  Private
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const book = await bookQueries.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }

        res.json({
            success: true,
            book: book
        });
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el libro'
        });
    }
});

// @route   GET /api/books/:id/view
// @desc    View PDF (redirect to Cloudinary URL)
// @access  Private
router.get('/:id/view', isAuthenticated, async (req, res) => {
    try {
        const book = await bookQueries.findById(req.params.id);

        if (!book || !book.pdf_path) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }

        // Redirect to Cloudinary URL
        res.redirect(book.pdf_path);
    } catch (error) {
        console.error('Error viewing book:', error);
        res.status(500).json({
            success: false,
            message: 'Error al visualizar el libro'
        });
    }
});

// @route   GET /api/books/:id/download
// @desc    Download PDF or DOCX
// @access  Private
router.get('/:id/download', isAuthenticated, async (req, res) => {
    try {
        const book = await bookQueries.findById(req.params.id);
        const format = req.query.format || 'pdf';

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }

        let fileUrl;
        if (format === 'docx') {
            if (!book.docx_path) {
                return res.status(404).json({
                    success: false,
                    message: 'Versión Word no disponible'
                });
            }
            fileUrl = book.docx_path;
        } else {
            fileUrl = book.pdf_path;
        }

        // Redirect to Cloudinary URL with attachment flag
        res.redirect(fileUrl.replace('/upload/', '/upload/fl_attachment/'));
    } catch (error) {
        console.error('Error downloading book:', error);
        res.status(500).json({
            success: false,
            message: 'Error al descargar el libro'
        });
    }
});

// @route   GET /api/books/:id/cover
// @desc    Get book cover image
// @access  Private
router.get('/:id/cover', isAuthenticated, async (req, res) => {
    try {
        const book = await bookQueries.findById(req.params.id);

        if (!book || !book.cover_path) {
            return res.status(404).json({
                success: false,
                message: 'Portada no encontrada'
            });
        }

        // Redirect to Cloudinary URL
        res.redirect(book.cover_path);
    } catch (error) {
        console.error('Error fetching cover:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la portada'
        });
    }
});

// @route   DELETE /api/books/:id
// @desc    Delete a book
// @access  Private (Owner or Admin)
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const book = await bookQueries.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }

        // Check permissions
        const isOwner = book.user_id === req.user.id;
        const isAdmin = req.user.isAdmin;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar este libro'
            });
        }

        // Delete files from Cloudinary
        try {
            if (book.pdf_path) {
                const publicId = book.pdf_path.split('/').slice(-2).join('/').split('.')[0];
                await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
            }
            if (book.docx_path) {
                const publicId = book.docx_path.split('/').slice(-2).join('/').split('.')[0];
                await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
            }
            if (book.cover_path) {
                const publicId = book.cover_path.split('/').slice(-2).join('/').split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }
        } catch (deleteError) {
            console.error('Error deleting files from Cloudinary:', deleteError);
        }

        // Delete from database
        if (isAdmin) {
            await bookQueries.deleteById(req.params.id);
        } else {
            await bookQueries.delete(req.params.id, req.user.id);
        }

        res.json({
            success: true,
            message: 'Libro eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el libro'
        });
    }
});

module.exports = router;
