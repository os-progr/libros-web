
// ============================================
// PDF TOOLS MANAGER
// ============================================
const PdfTools = {
    init() {
        const toolsBtn = document.getElementById('toolsBtn');
        const modal = document.getElementById('toolsModal');
        const closeBtn = document.getElementById('closeToolsModal');
        const form = document.getElementById('convertForm');
        const fileInput = document.getElementById('convertFile');
        const fileName = document.getElementById('convertFileName');

        if (!toolsBtn || !modal) return;

        // Open modal
        toolsBtn.addEventListener('click', () => {
            modal.classList.add('active');
        });

        // Close modal
        const closeModal = () => {
            modal.classList.remove('active');
            if (form) form.reset();
            if (fileName) fileName.textContent = '';
            document.getElementById('conversionStatus').classList.add('hidden');
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // File name display
        if (fileInput) {
            fileInput.addEventListener('change', () => {
                if (fileInput.files.length > 0) {
                    fileName.textContent = fileInput.files[0].name;
                }
            });
        }

        // Form submit
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleConversion(form);
            });
        }
    },

    async handleConversion(form) {
        const fileInput = document.getElementById('convertFile');
        const statusDiv = document.getElementById('conversionStatus');
        const submitBtn = document.getElementById('btnConvert');

        if (!fileInput.files.length) {
            this.showStatus('Por favor selecciona un archivo', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        try {
            // UI Loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>⏳</span><span>Convirtiendo...</span>';
            this.showStatus('Subiendo y convirtiendo archivo...', 'info');

            const response = await fetch('/api/tools/convert-docx', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error en la conversión');
            }

            // Success - Trigger download
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = fileInput.files[0].name.replace(/\.(docx|doc)$/i, '') + '.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);

            this.showStatus('✅ ¡Conversión exitosa! Tu descarga comenzará en breve.', 'success');
            setTimeout(() => {
                document.getElementById('toolsModal').classList.remove('active');
                form.reset();
                document.getElementById('convertFileName').textContent = '';
                statusDiv.classList.add('hidden');
            }, 3000);

        } catch (error) {
            console.error('Conversion error:', error);
            this.showStatus('❌ ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>🔄</span><span>Convertir a PDF</span>';
        }
    },

    showStatus(message, type) {
        const statusDiv = document.getElementById('conversionStatus');
        statusDiv.textContent = message;
        statusDiv.className = `status-message ${type}`;
        statusDiv.classList.remove('hidden');
    }
};

// Initialize tools when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    PdfTools.init();
});
