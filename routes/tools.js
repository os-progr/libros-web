const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const puppeteer = require('puppeteer');

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
// @route   POST /api/tools/convert-docx
// @desc    Convert DOCX to PDF using Mammoth + Puppeteer (No LibreOffice required)
// @access  Public
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

        // 1. Convert DOCX to HTML using Mammoth
        const result = await mammoth.convertToHtml({ path: inputPath });
        const htmlContent = result.value; // The generated HTML

        if (!htmlContent) {
            throw new Error('No se pudo extraer contenido del documento.');
        }

        // 2. Add basic styling to the HTML
        const styledHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        line-height: 1.6;
                        color: #333;
                        padding: 40px;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    img { max-width: 100%; height: auto; }
                    h1, h2, h3 { color: #000; }
                    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                    td, th { border: 1px solid #ddd; padding: 8px; }
                </style>
            </head>
            <body>
                ${htmlContent}
            </body>
            </html>
        `;

        // 3. Convert HTML to PDF using Puppeteer
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.setContent(styledHtml, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        await browser.close();

        // Write PDF to output path
        await fs.promises.writeFile(outputPath, pdfBuffer);

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
            message: 'Error en la conversión: ' + error.message
        });
    }
});

module.exports = router;
