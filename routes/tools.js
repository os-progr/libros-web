const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const libre = require('libreoffice-convert');
const { promisify } = require('util');

const libreConvert = promisify(libre.convert);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/temp');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
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
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.doc' || ext === '.docx') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos Word (.doc, .docx)'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @route   POST /api/tools/convert-docx
// @desc    Convert DOCX to PDF
// @access  Public (or Protected if desired)
router.post('/convert-docx', upload.single('file'), async (req, res) => {
    let inputPath = null;
    let outputPath = null;

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se subió ningún archivo'
            });
        }

        inputPath = req.file.path;
        const outputFilename = path.basename(inputPath, path.extname(inputPath)) + '.pdf';
        outputPath = path.join(path.dirname(inputPath), outputFilename);

        // Read file
        const docxBuf = await fs.promises.readFile(inputPath);

        // Convert it to pdf format
        // Note: This relies on LibreOffice being installed on the server/system
        let pdfBuf;
        try {
            pdfBuf = await libreConvert(docxBuf, '.pdf', undefined);
        } catch (convertError) {
            console.error('LibreOffice conversion failed:', convertError);
            throw new Error('Error al convertir: Asegúrate de que LibreOffice esté instalado en el servidor.');
        }

        // Write output to file (optional, we could just send buffer directly)
        await fs.promises.writeFile(outputPath, pdfBuf);

        // Send file to client
        res.download(outputPath, req.file.originalname.replace(/\.(docx|doc)$/i, '.pdf'), async (err) => {
            // Cleanup files after download (or error)
            try {
                if (fs.existsSync(inputPath)) await fs.promises.unlink(inputPath);
                if (fs.existsSync(outputPath)) await fs.promises.unlink(outputPath);
            } catch (cleanupErr) {
                console.error('Cleanup error:', cleanupErr);
            }
        });

    } catch (error) {
        console.error('Conversion Route Error:', error);

        // Cleanup if error occurred before final cleanup
        try {
            if (inputPath && fs.existsSync(inputPath)) await fs.promises.unlink(inputPath);
            if (outputPath && fs.existsSync(outputPath)) await fs.promises.unlink(outputPath);
        } catch (e) { }

        res.status(500).json({
            success: false,
            message: error.message || 'Error interno durante la conversión'
        });
    }
});

module.exports = router;
