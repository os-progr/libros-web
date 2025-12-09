// ============================================
// BOOK API ROUTES
// ============================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { isAuthenticated } = require('../middleware/auth');
const { bookQueries } = require('../config/database');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        let uploadDir = 'uploads/others';

        if (file.fieldname === 'pdf') {
            uploadDir = 'uploads/pdfs';
        } else if (file.fieldname === 'docx') {
            uploadDir = 'uploads/docs';
        } else if (file.fieldname === 'cover') {
            uploadDir = 'uploads/covers';
        }

        // Create directory if it doesn't exist
        try {
            await fs.mkdir(uploadDir, { recursive: true });
        } catch (error) {
            console.error('Error creating upload directory:', error);
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit (increased for docs)
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

// @route   GET /api/books
// @desc    Get all books for authenticated user
// @access  Private
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const books = await bookQueries.findAll();
        res.json({
            success: true,
            books: books
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
            const { title, author, description } = req.body;

            // Validate required fields
            if (!title || !author || !req.files?.pdf) {
                return res.status(400).json({
                    success: false,
                    message: 'Título, autor y archivo PDF son obligatorios'
                });
            }

            const pdfFile = req.files.pdf[0];
            const docxFile = req.files.docx ? req.files.docx[0] : null;
            const coverFile = req.files.cover ? req.files.cover[0] : null;

            // Upload files to Cloudinary
            let pdfUrl, docxUrl, coverUrl;

            // Upload PDF (required)
            const pdfUpload = await uploadToCloudinary(pdfFile.path, 'pdfs', 'raw');
            if (!pdfUpload.success) {
                await fs.unlink(pdfFile.path).catch(console.error);
                return res.status(500).json({
                    success: false,
                    message: 'Error al subir el PDF'
                });
            }
            pdfUrl = pdfUpload.url;
            await fs.unlink(pdfFile.path).catch(console.error);

            // Upload DOCX (optional)
            if (docxFile) {
                const docxUpload = await uploadToCloudinary(docxFile.path, 'docs', 'raw');
                if (docxUpload.success) {
                    docxUrl = docxUpload.url;
                }
                await fs.unlink(docxFile.path).catch(console.error);
            }

            // Upload Cover (optional)
            if (coverFile) {
                const coverUpload = await uploadToCloudinary(coverFile.path, 'covers', 'image');
                if (coverUpload.success) {
                    coverUrl = coverUpload.url;
                }
                await fs.unlink(coverFile.path).catch(console.error);
            }

            // Create book in database with Cloudinary URLs
            const bookId = await bookQueries.create({
                userId: req.user.id,
                title,
                author,
                description,
                pdfPath: pdfUrl,
                docxPath: docxUrl || null,
                coverPath: coverUrl || null,
                allowDownload: true
            });

            // Fetch the created book
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

        // Ownership check removed for viewing details
        // if (book.user_id !== req.user.id) { ... }

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
// @desc    View PDF in browser
// @access  Private
router.get('/:id/view', isAuthenticated, async (req, res) => {
    try {
        const book = await bookQueries.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }

        // Check if it's a remote URL (Cloudinary) or local file
        if (book.pdf_path && book.pdf_path.startsWith('http')) {
            res.redirect(book.pdf_path);
        } else {
            // Serve local file
            const filePath = path.resolve(__dirname, '..', book.pdf_path);
            res.sendFile(filePath, (err) => {
                if (err) {
                    console.error('Error serving local file:', err);
                    res.status(404).send('Archivo no encontrado');
                }
            });
        }
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
        let filename;

        if (format === 'docx') {
            if (!book.docx_path) {
                return res.status(404).json({
                    success: false,
                    message: 'Versión Word no disponible'
                });
            }
            fileUrl = book.docx_path;
            filename = `${book.title} - ${book.author}.docx`;
        } else {
            fileUrl = book.pdf_path;
            filename = `${book.title} - ${book.author}.pdf`;
        }

        // Register download in database
        const db = require('../config/database');
        try {
            await db.query(
                'INSERT INTO downloads (user_id, book_id) VALUES (?, ?)',
                [req.user.id, book.id]
            );
        } catch (dbError) {
            console.error('Error registering download:', dbError);
        }

        // Handle File Download
        if (fileUrl && fileUrl.startsWith('http')) {
            // Cloudinary / Remote logic
            let downloadUrl = fileUrl;
            if (fileUrl.includes('cloudinary.com')) {
                // Insert fl_attachment before the version number or file path to force download
                // This regex works for typical Cloudinary URLs
                downloadUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
            }
            res.redirect(downloadUrl);
        } else {
            // Local file logic
            // Clean filename characters
            const safeFilename = filename.replace(/[^a-z0-9\s.-]/gi, '_');
            const filePath = path.resolve(__dirname, '..', fileUrl);

            res.download(filePath, safeFilename, (err) => {
                if (err) {
                    console.error('Error downloading local file:', err);
                    if (!res.headersSent) {
                        res.status(404).send('Archivo no encontrado');
                    }
                }
            });
        }
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

        if (book.cover_path.startsWith('http')) {
            res.redirect(book.cover_path);
        } else {
            const filePath = path.resolve(__dirname, '..', book.cover_path);
            res.sendFile(filePath, (err) => {
                if (err) {
                    // Try serving a default placeholder if cover missing
                    console.error('Error serving local cover:', err);
                    res.status(404).send('Portada no encontrada');
                }
            });
        }
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
// @access  Private
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        console.log(`[DELETE] Request to delete book ${req.params.id} by user ${req.user.email}`);
        const book = await bookQueries.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }

        // Check if user owns the book or is admin
        const adminEmails = ['edaninguna@gmail.com'];
        const userEmail = req.user.email ? req.user.email.toLowerCase().trim() : '';
        const isOwner = book.user_id === req.user.id;
        const isAdmin = adminEmails.includes(userEmail);

        console.log(`[DELETE] Permission check - Owner: ${isOwner}, Admin: ${isAdmin} (${userEmail})`);

        if (!isOwner && !isAdmin) {
            console.log('[DELETE] Permission denied');
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar este libro'
            });
        }

        // Files are now in Cloudinary, no need to delete from local filesystem
        // Cloudinary files can be deleted manually if needed via admin panel

        // Delete from database
        // Monitor deletion strategy
        if (isAdmin) {
            // Admin deletion (bypasses ownership check)
            console.log('[DELETE] Executing Admin deletion');
            await bookQueries.deleteAny(req.params.id);
        } else {
            // User deletion (enforces ownership)
            console.log('[DELETE] Executing Owner deletion');
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
