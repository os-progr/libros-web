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
        const books = await bookQueries.findByUserId(req.user.id);
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

            const pdfPath = req.files.pdf[0].path;
            const docxPath = req.files.docx ? req.files.docx[0].path : null;
            const coverPath = req.files.cover ? req.files.cover[0].path : null;

            // Create book in database
            const bookId = await bookQueries.create({
                userId: req.user.id,
                title,
                author,
                description,
                pdfPath,
                docxPath,
                coverPath,
                allowDownload: true // Always allow download
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

        // Check if user owns the book
        if (book.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver este libro'
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

        // Check if user owns the book
        if (book.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver este libro'
            });
        }

        // Send PDF file
        res.sendFile(path.resolve(book.pdf_path));
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

        // Check if user owns the book
        if (book.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para descargar este libro'
            });
        }

        let filePath;
        let filename;

        if (format === 'docx') {
            if (!book.docx_path) {
                return res.status(404).json({
                    success: false,
                    message: 'Versión Word no disponible'
                });
            }
            filePath = book.docx_path;
            filename = `${book.title} - ${book.author}.docx`;
        } else {
            filePath = book.pdf_path;
            filename = `${book.title} - ${book.author}.pdf`;
        }

        // Send file as download
        res.download(path.resolve(filePath), filename);
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

        // Check if user owns the book
        if (book.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver esta portada'
            });
        }

        res.sendFile(path.resolve(book.cover_path));
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
        const book = await bookQueries.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Libro no encontrado'
            });
        }

        // Check if user owns the book
        if (book.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar este libro'
            });
        }

        // Delete files from filesystem
        try {
            if (book.pdf_path) await fs.unlink(book.pdf_path);
            if (book.docx_path) await fs.unlink(book.docx_path);
            if (book.cover_path) await fs.unlink(book.cover_path);
        } catch (fileError) {
            console.error('Error deleting files:', fileError);
        }

        // Delete from database
        await bookQueries.delete(req.params.id, req.user.id);

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
