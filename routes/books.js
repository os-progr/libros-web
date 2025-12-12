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
const { sanitizeFilePath, sanitizeFilename, isAllowedRemoteUrl } = require('../utils/security');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { validateBookCreation, validateBookId } = require('../middleware/validators');

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
    uploadLimiter, // Rate limiting for uploads
    upload.fields([
        { name: 'pdf', maxCount: 1 },
        { name: 'docx', maxCount: 1 },
        { name: 'cover', maxCount: 1 }
    ]),
    validateBookCreation, // Input validation
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
router.get('/:id', isAuthenticated, validateBookId, async (req, res) => {
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
router.get('/:id/view', isAuthenticated, validateBookId, async (req, res) => {
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
            // Validate it's from an allowed domain
            if (!isAllowedRemoteUrl(book.pdf_path)) {
                return res.status(403).json({
                    success: false,
                    message: 'URL no permitida'
                });
            }

            // Proxy the content to avoid CORS/X-Frame-Options issues
            const https = require('https');
            const http = require('http');

            const fetchUrl = (urlToFetch) => {
                console.log(`[PROXY] Requesting: ${urlToFetch}`);
                const protocol = urlToFetch.startsWith('https') ? https : http;

                const request = protocol.get(urlToFetch, (response) => {
                    console.log(`[PROXY] Response status: ${response.statusCode}`);

                    // Handle Redirects (301, 302, 307, etc.)
                    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                        console.log(`[PROXY] Redirecting to: ${response.headers.location}`);
                        return fetchUrl(response.headers.location);
                    }

                    if (response.statusCode !== 200) {
                        console.error(`[PROXY] Error fetching file. Status: ${response.statusCode}`);
                        return res.status(response.statusCode).send(`Error al obtener el archivo remoto (Status: ${response.statusCode})`);
                    }

                    // Set appropriate headers
                    res.setHeader('Content-Type', 'application/pdf');
                    // Force inline to view in browser
                    res.setHeader('Content-Disposition', 'inline; filename="book.pdf"');

                    if (response.headers['content-length']) {
                        res.setHeader('Content-Length', response.headers['content-length']);
                    }

                    response.pipe(res);
                });

                request.on('error', (err) => {
                    console.error('[PROXY] Network error:', err);
                    if (!res.headersSent) {
                        res.status(500).json({
                            success: false,
                            message: 'Error de red al visualizar el libro'
                        });
                    }
                });
            };

            fetchUrl(book.pdf_path);
        } else {
            try {
                // Sanitize the path to prevent traversal attacks
                const sanitizedPath = sanitizeFilePath(book.pdf_path);
                const filePath = path.resolve(__dirname, '..', sanitizedPath);

                res.sendFile(filePath, (err) => {
                    if (err) {
                        console.error('Error serving local file:', err);
                        res.status(404).send('Archivo no encontrado');
                    }
                });
            } catch (securityError) {
                console.error('Security error in file path:', securityError);
                return res.status(403).json({
                    success: false,
                    message: 'Ruta de archivo no válida'
                });
            }
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
router.get('/:id/download', isAuthenticated, validateBookId, async (req, res) => {
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
            // Validate remote URL
            if (!isAllowedRemoteUrl(fileUrl)) {
                return res.status(403).json({
                    success: false,
                    message: 'URL no permitida'
                });
            }

            // Cloudinary / Remote logic
            // Proxy logic to ensure download works without CORS/Blocked issues
            const https = require('https');
            const http = require('http');

            const fetchDownload = (urlToFetch) => {
                console.log(`[DOWNLOAD] Requesting: ${urlToFetch}`);
                const protocol = urlToFetch.startsWith('https') ? https : http;

                const request = protocol.get(urlToFetch, (response) => {
                    console.log(`[DOWNLOAD] Response status: ${response.statusCode}`);

                    // Handle Redirects
                    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                        console.log(`[DOWNLOAD] Redirecting to: ${response.headers.location}`);
                        return fetchDownload(response.headers.location);
                    }

                    if (response.statusCode !== 200) {
                        console.error(`[DOWNLOAD] Error fetching file. Status: ${response.statusCode}`);
                        return res.status(response.statusCode).send(`Error al obtener el archivo remoto (Status: ${response.statusCode})`);
                    }

                    // Set headers for download
                    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');

                    // Encode filename for headers (safe ascii)
                    const encodedFilename = encodeURIComponent(filename).replace(/%20/g, ' ');
                    res.setHeader('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);

                    if (response.headers['content-length']) {
                        res.setHeader('Content-Length', response.headers['content-length']);
                    }

                    response.pipe(res);
                });

                request.on('error', (err) => {
                    console.error('[DOWNLOAD] Network error:', err);
                    if (!res.headersSent) {
                        res.status(500).json({
                            success: false,
                            message: 'Error de red al descargar el libro'
                        });
                    }
                });
            };

            fetchDownload(fileUrl);
        } else {
            try {
                // Sanitize filename and path
                const safeFilename = sanitizeFilename(filename);
                const sanitizedPath = sanitizeFilePath(fileUrl);
                const filePath = path.resolve(__dirname, '..', sanitizedPath);

                res.download(filePath, safeFilename, (err) => {
                    if (err) {
                        console.error('Error downloading local file:', err);
                        if (!res.headersSent) {
                            res.status(404).send('Archivo no encontrado');
                        }
                    }
                });
            } catch (securityError) {
                console.error('Security error in download:', securityError);
                return res.status(403).json({
                    success: false,
                    message: 'Ruta de archivo no válida'
                });
            }
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
router.get('/:id/cover', isAuthenticated, validateBookId, async (req, res) => {
    try {
        const book = await bookQueries.findById(req.params.id);

        if (!book || !book.cover_path) {
            return res.status(404).json({
                success: false,
                message: 'Portada no encontrada'
            });
        }

        if (book.cover_path.startsWith('http')) {
            // Validate remote URL
            if (!isAllowedRemoteUrl(book.cover_path)) {
                return res.status(403).json({
                    success: false,
                    message: 'URL no permitida'
                });
            }
            res.redirect(book.cover_path);
        } else {
            try {
                // Sanitize path
                const sanitizedPath = sanitizeFilePath(book.cover_path);
                const filePath = path.resolve(__dirname, '..', sanitizedPath);

                res.sendFile(filePath, (err) => {
                    if (err) {
                        console.error('Error serving local cover:', err);
                        res.status(404).send('Portada no encontrada');
                    }
                });
            } catch (securityError) {
                console.error('Security error in cover path:', securityError);
                return res.status(403).json({
                    success: false,
                    message: 'Ruta de archivo no válida'
                });
            }
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
router.delete('/:id', isAuthenticated, validateBookId, async (req, res) => {
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
