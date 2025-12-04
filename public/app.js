// ============================================
// LIBROS WEB - FRONTEND APPLICATION
// With Backend API Integration
// ============================================

// ============================================
// CODE PROTECTION - Anti-Inspection Measures
// ============================================
(function () {
    'use strict';

    // Check if developer mode is enabled
    function isDevModeEnabled() {
        return localStorage.getItem('developerMode') === 'true';
    }

    // Disable right-click context menu
    function preventContextMenu(e) {
        if (!isDevModeEnabled()) {
            e.preventDefault();
            return false;
        }
    }

    // Disable common developer shortcuts
    function preventDevShortcuts(e) {
        if (!isDevModeEnabled()) {
            if (e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                (e.ctrlKey && e.key === 'u') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                (e.ctrlKey && e.key === 's')) {
                e.preventDefault();
                return false;
            }
        }
    }

    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventDevShortcuts);
})();

// ============================================
// APPLICATION STATE
// ============================================
const AppState = {
    user: null,
    books: [],
    currentBook: null,
    searchQuery: '',
    isAuthenticated: false
};

// ============================================
// DEVELOPER MODE MANAGER (Admin Only)
// ============================================
const DeveloperMode = {
    adminEmail: 'edaninguna@gmail.com',

    init(user) {
        // Only show developer icon for admin
        if (user && user.email === this.adminEmail) {
            const developerToggle = document.getElementById('developerToggle');
            if (developerToggle) {
                developerToggle.classList.remove('hidden');
                developerToggle.addEventListener('click', () => this.toggleDevMode());
            }
        }

        // Load saved developer mode state
        const devMode = localStorage.getItem('developerMode') === 'true';
        if (devMode) {
            this.enableDevMode();
        }
    },

    toggleDevMode() {
        const isEnabled = localStorage.getItem('developerMode') === 'true';
        if (isEnabled) {
            this.disableDevMode();
        } else {
            this.enableDevMode();
        }
    },

    enableDevMode() {
        localStorage.setItem('developerMode', 'true');
        // Re-enable developer tools
        document.removeEventListener('contextmenu', this.preventContextMenu);
        document.removeEventListener('keydown', this.preventDevShortcuts);
        alert('🔧 Modo Desarrollador Activado\n\nHerramientas de desarrollador habilitadas.');
    },

    disableDevMode() {
        localStorage.setItem('developerMode', 'false');
        // Disable developer tools again
        document.addEventListener('contextmenu', this.preventContextMenu);
        document.addEventListener('keydown', this.preventDevShortcuts);
        alert('🔒 Modo Desarrollador Desactivado\n\nHerramientas de desarrollador bloqueadas.');
    },

    preventContextMenu(e) {
        e.preventDefault();
        return false;
    },

    preventDevShortcuts(e) {
        if (e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J') ||
            (e.ctrlKey && e.key === 'u') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.key === 's')) {
            e.preventDefault();
            return false;
        }
    }
};

// ============================================
// API CLIENT
// ============================================
const API = {
    baseURL: '',

    // Check authentication status
    async checkAuth() {
        try {
            const response = await fetch('/auth/user', {
                credentials: 'include'
            });
            const data = await response.json();
            return data.success ? data.user : null;
        } catch (error) {
            console.error('Error checking auth:', error);
            return null;
        }
    },

    // Logout
    async logout() {
        try {
            const response = await fetch('/auth/logout', {
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            console.error('Error logging out:', error);
            return { success: false };
        }
    },

    // Get all books
    async getBooks() {
        try {
            const response = await fetch('/api/books', {
                credentials: 'include'
            });
            const data = await response.json();
            return data.success ? data.books : [];
        } catch (error) {
            console.error('Error fetching books:', error);
            return [];
        }
    },

    // Upload book
    async uploadBook(formData) {
        try {
            const response = await fetch('/api/books', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Error uploading book:', error);
            return { success: false, message: 'Error al subir el libro' };
        }
    },

    // Delete book
    async deleteBook(id) {
        try {
            const response = await fetch(`/api/books/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            console.error('Error deleting book:', error);
            return { success: false };
        }
    }
};

// ============================================
// UI MANAGER
// ============================================
const UIManager = {
    // Show/hide sections based on auth status
    updateAuthUI(user) {
        const authenticatedActions = document.getElementById('authenticatedActions');
        const unauthenticatedActions = document.getElementById('unauthenticatedActions');
        const welcomeScreen = document.getElementById('welcomeScreen');
        const booksSection = document.getElementById('booksSection');

        if (user) {
            // User is authenticated
            authenticatedActions.classList.remove('hidden');
            unauthenticatedActions.classList.add('hidden');
            welcomeScreen.classList.add('hidden');
            booksSection.classList.remove('hidden');

            // Update user profile
            document.getElementById('userName').textContent = user.name;
            document.getElementById('userPicture').src = user.picture || '';
        } else {
            // User is not authenticated
            authenticatedActions.classList.add('hidden');
            unauthenticatedActions.classList.remove('hidden');
            welcomeScreen.classList.remove('hidden');
            booksSection.classList.add('hidden');
        }
    },

    // Render books grid
    renderBooks(books) {
        const booksGrid = document.getElementById('booksGrid');
        const emptyState = document.getElementById('emptyState');

        if (books.length === 0) {
            booksGrid.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        booksGrid.innerHTML = books.map(book => `
            <div class="book-card fade-in" data-book-id="${book.id}">
                <div class="book-cover">
                    ${book.cover_path
                ? `<img src="/api/books/${book.id}/cover" alt="${this.escapeHtml(book.title)}">`
                : `<div class="book-cover-placeholder">📖</div>`
            }
                </div>
                <div class="book-info">
                    <h3 class="book-title">${this.escapeHtml(book.title)}</h3>
                    <p class="book-author">por ${this.escapeHtml(book.author)}</p>
                    ${book.description ? `<p class="book-description">${this.escapeHtml(book.description)}</p>` : ''}
                    <div class="book-meta">
                        <span class="download-badge download-allowed">
                            ✓ Descarga libre
                        </span>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers to book cards
        document.querySelectorAll('.book-card').forEach(card => {
            card.addEventListener('click', () => {
                const bookId = card.dataset.bookId;
                this.openBookViewer(bookId);
            });
        });
    },

    // Open book viewer modal
    openBookViewer(bookId) {
        const book = AppState.books.find(b => b.id == bookId);
        if (!book) return;

        AppState.currentBook = book;

        const viewerModal = document.getElementById('viewerModal');
        const viewerTitle = document.getElementById('viewerTitle');
        const pdfViewer = document.getElementById('pdfViewer');
        const downloadPdfBtn = document.getElementById('downloadPdfBtn');
        const downloadDocxBtn = document.getElementById('downloadDocxBtn');

        viewerTitle.textContent = book.title;
        pdfViewer.src = `/api/books/${book.id}/view`;

        // Always show PDF download
        downloadPdfBtn.classList.remove('hidden');

        // Show DOCX download if available
        if (book.docx_path) {
            downloadDocxBtn.classList.remove('hidden');
        } else {
            downloadDocxBtn.classList.add('hidden');
        }

        viewerModal.classList.add('active');
    },

    // Close book viewer modal
    closeBookViewer() {
        const viewerModal = document.getElementById('viewerModal');
        const pdfViewer = document.getElementById('pdfViewer');

        viewerModal.classList.remove('active');
        pdfViewer.src = '';
        AppState.currentBook = null;
    },

    // Open upload modal
    openUploadModal() {
        const uploadModal = document.getElementById('uploadModal');
        uploadModal.classList.add('active');
    },

    // Close upload modal
    closeUploadModal() {
        const uploadModal = document.getElementById('uploadModal');
        uploadModal.classList.remove('active');
        document.getElementById('uploadForm').reset();
        document.getElementById('fileName').textContent = '';
        document.getElementById('docxFileName').textContent = '';
        document.getElementById('coverFileName').textContent = '';
    },

    // Download current book
    downloadCurrentBook(format = 'pdf') {
        if (!AppState.currentBook) return;

        const book = AppState.currentBook;
        const formatName = format === 'pdf' ? 'PDF' : 'Word';
        const message = `¿Deseas descargar "${book.title}" en formato ${formatName}?`;

        if (confirm(message)) {
            window.location.href = `/api/books/${AppState.currentBook.id}/download?format=${format}`;

            // Show success message
            setTimeout(() => {
                alert(`✅ Descarga iniciada: ${book.title} (${formatName})`);
            }, 500);
        }
    },

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Show loading state
    showLoading(button) {
        button.disabled = true;
        button.innerHTML = '<span class="loading"></span><span>Procesando...</span>';
    },

    // Hide loading state
    hideLoading(button, originalHTML) {
        button.disabled = false;
        button.innerHTML = originalHTML;
    }
};

// ============================================
// EVENT HANDLERS
// ============================================
const EventHandlers = {
    // Handle upload form submission
    async handleUploadSubmit(e) {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;

        try {
            UIManager.showLoading(submitBtn);

            const formData = new FormData();
            formData.append('title', document.getElementById('bookTitle').value.trim());
            formData.append('author', document.getElementById('bookAuthor').value.trim());
            formData.append('description', document.getElementById('bookDescription').value.trim());

            const pdfFile = document.getElementById('bookFile').files[0];
            const docxFile = document.getElementById('bookDocx').files[0];
            const coverFile = document.getElementById('bookCover').files[0];

            if (pdfFile) formData.append('pdf', pdfFile);
            if (docxFile) formData.append('docx', docxFile);
            if (coverFile) formData.append('cover', coverFile);

            const result = await API.uploadBook(formData);

            if (result.success) {
                alert('¡Libro publicado exitosamente!');
                UIManager.closeUploadModal();
                await loadBooks();
            } else {
                alert(result.message || 'Error al publicar el libro');
            }
        } catch (error) {
            console.error('Error uploading book:', error);
            alert('Error al publicar el libro. Por favor intenta de nuevo.');
        } finally {
            UIManager.hideLoading(submitBtn, originalHTML);
        }
    },

    // Handle search input
    handleSearch(e) {
        const query = e.target.value.trim().toLowerCase();
        AppState.searchQuery = query;

        if (!query) {
            UIManager.renderBooks(AppState.books);
            return;
        }

        const filteredBooks = AppState.books.filter(book =>
            book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query) ||
            (book.description && book.description.toLowerCase().includes(query))
        );

        UIManager.renderBooks(filteredBooks);
    },

    // Handle file input change
    handleFileChange(e) {
        const file = e.target.files[0];
        let fileNameElement;

        if (e.target.id === 'bookFile') fileNameElement = document.getElementById('fileName');
        else if (e.target.id === 'bookDocx') fileNameElement = document.getElementById('docxFileName');
        else fileNameElement = document.getElementById('coverFileName');

        if (file) {
            fileNameElement.textContent = `Seleccionado: ${file.name}`;
        } else {
            fileNameElement.textContent = '';
        }
    },

    // Handle logout
    async handleLogout() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            const result = await API.logout();
            if (result.success) {
                window.location.reload();
            }
        }
    }
};

// ============================================
// INITIALIZATION
// ============================================
async function loadBooks() {
    const books = await API.getBooks();
    AppState.books = books;
    UIManager.renderBooks(books);
}

async function initializeApp() {
    // Check authentication status
    const user = await API.checkAuth();
    AppState.user = user;
    AppState.isAuthenticated = !!user;

    // Initialize Developer Mode (only for admin)
    DeveloperMode.init(user);

    // Update UI based on auth status
    UIManager.updateAuthUI(user);

    // If authenticated, load books
    if (user) {
        await loadBooks();
    }

    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Upload modal
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            UIManager.openUploadModal();
        });
    }

    document.getElementById('closeUploadModal').addEventListener('click', () => {
        UIManager.closeUploadModal();
    });

    // Upload form
    document.getElementById('uploadForm').addEventListener('submit', EventHandlers.handleUploadSubmit);

    // File inputs
    document.getElementById('bookFile').addEventListener('change', EventHandlers.handleFileChange);
    document.getElementById('bookDocx').addEventListener('change', EventHandlers.handleFileChange);
    document.getElementById('bookCover').addEventListener('change', EventHandlers.handleFileChange);

    // Search
    document.getElementById('searchInput').addEventListener('input', EventHandlers.handleSearch);

    // Viewer modal
    document.getElementById('closeViewerModal').addEventListener('click', () => {
        UIManager.closeBookViewer();
    });

    document.getElementById('closeViewerBtn').addEventListener('click', () => {
        UIManager.closeBookViewer();
    });

    document.getElementById('downloadPdfBtn').addEventListener('click', () => {
        UIManager.downloadCurrentBook('pdf');
    });

    document.getElementById('downloadDocxBtn').addEventListener('click', () => {
        UIManager.downloadCurrentBook('docx');
    });

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', EventHandlers.handleLogout);
    }

    // Close modals when clicking outside
    document.getElementById('uploadModal').addEventListener('click', (e) => {
        if (e.target.id === 'uploadModal') {
            UIManager.closeUploadModal();
        }
    });

    document.getElementById('viewerModal').addEventListener('click', (e) => {
        if (e.target.id === 'viewerModal') {
            UIManager.closeBookViewer();
        }
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const uploadModal = document.getElementById('uploadModal');
            const viewerModal = document.getElementById('viewerModal');

            if (uploadModal.classList.contains('active')) {
                UIManager.closeUploadModal();
            }
            if (viewerModal.classList.contains('active')) {
                UIManager.closeBookViewer();
            }
        }
    });
}

// ============================================
// START APPLICATION
// ============================================
document.addEventListener('DOMContentLoaded', initializeApp);
