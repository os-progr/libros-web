// ============================================
// LIBROS WEB - FRONTEND APPLICATION
// With Backend API Integration
// ============================================

// ============================================
// CODE PROTECTION - Anti-Inspection Measures
// ============================================
(function () {
    'use strict';

    // Disable right-click context menu
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        return false;
    });

    // Disable common developer shortcuts
    document.addEventListener('keydown', function (e) {
        if (e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J') ||
            (e.ctrlKey && e.key === 'u') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.key === 's')) {
            e.preventDefault();
            return false;
        }
    });
})();

// ============================================
// APPLICATION STATE
// ============================================
const AppState = {
    user: null,
    books: [],
    genres: [],
    polls: [],
    currentBook: null,
    searchQuery: '',
    isAuthenticated: false,
    isAdmin: false
};

// ============================================
// THEME MANAGER
// ============================================
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);

        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.updateIcon(theme);
    },

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    updateIcon(theme) {
        const icon = document.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = theme === 'dark' ? '🌙' : '☀️';
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
    },

    // Get admin stats
    async getAdminStats() {
        try {
            const response = await fetch('/api/admin/dashboard', {
                credentials: 'include'
            });
            const data = await response.json();
            return data.success ? data.stats : null;
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            return null;
        }
    },

    // Get all genres
    async getGenres() {
        try {
            const response = await fetch('/api/polls/genres', {
                credentials: 'include'
            });
            const data = await response.json();
            return data.success ? data.genres : [];
        } catch (error) {
            console.error('Error fetching genres:', error);
            return [];
        }
    },

    // Get all active polls
    async getPolls() {
        try {
            const response = await fetch('/api/polls', {
                credentials: 'include'
            });
            const data = await response.json();
            return data.success ? data.polls : [];
        } catch (error) {
            console.error('Error fetching polls:', error);
            return [];
        }
    },

    // Vote in a poll
    async votePoll(pollId, optionId) {
        try {
            const response = await fetch(`/api/polls/${pollId}/vote`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ optionId })
            });
            return await response.json();
        } catch (error) {
            console.error('Error voting:', error);
            return { success: false, message: 'Error al votar' };
        }
    },

    // Report inappropriate content
    async reportContent(bookId, reason, description) {
        try {
            const response = await fetch('/api/admin/reports/create', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ bookId, reason, description })
            });
            return await response.json();
        } catch (error) {
            console.error('Error voting:', error);
            return { success: false, message: 'Error al votar' };
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
        const adminDashboard = document.getElementById('adminDashboard');

        if (user) {
            // User is authenticated
            authenticatedActions.classList.remove('hidden');
            unauthenticatedActions.classList.add('hidden');
            welcomeScreen.classList.add('hidden');
            booksSection.classList.remove('hidden');

            // Show admin dashboard if user is admin
            if (user.isAdmin) {
                adminDashboard.classList.remove('hidden');
                loadAdminStats();

                // Show admin panel link
                const adminPanelLink = document.getElementById('adminPanelLink');
                if (adminPanelLink) {
                    adminPanelLink.classList.remove('hidden');
                }
            } else {
                adminDashboard.classList.add('hidden');

                // Hide admin panel link
                const adminPanelLink = document.getElementById('adminPanelLink');
                if (adminPanelLink) {
                    adminPanelLink.classList.add('hidden');
                }
            }

            // Update user profile
            document.getElementById('userName').textContent = user.name;
            document.getElementById('userPicture').src = user.picture || '';
        } else {
            // User is not authenticated
            authenticatedActions.classList.add('hidden');
            unauthenticatedActions.classList.remove('hidden');
            welcomeScreen.classList.remove('hidden');
            booksSection.classList.add('hidden');
            adminDashboard.classList.add('hidden');
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

        booksGrid.innerHTML = books.map(book => {
            // Get genre info
            let genreBadge = '';
            if (book.genre_id) {
                const genre = AppState.genres.find(g => g.id === book.genre_id);
                if (genre) {
                    genreBadge = `<span class="genre-badge" style="background-color: ${genre.color}">${this.escapeHtml(genre.name)}</span>`;
                }
            }

            return `
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
                    ${genreBadge}
                    ${book.description ? `<p class="book-description">${this.escapeHtml(book.description)}</p>` : ''}
                    <div class="book-meta">
                        <span class="book-publisher">📤 ${this.escapeHtml(book.user_name || 'Usuario')}</span>
                        <span class="download-badge download-allowed">
                            ✓ Descarga libre
                        </span>
                    </div>
                    ${(book.isOwner || book.isAdmin) ? `
                        <button class="delete-book-btn" onclick="event.stopPropagation(); deleteBook(${book.id})">
                            🗑️ Eliminar ${book.isAdmin && !book.isOwner ? '(Admin)' : ''}
                        </button>
                    ` : ''}
                    ${!book.isOwner ? `
                        <button class="report-book-btn" onclick="event.stopPropagation(); reportBook(${book.id}, '${this.escapeHtml(book.title)}')">
                            🚨 Reportar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        }).join('');

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
        // Open download in new tab
        window.open(`/api/books/${AppState.currentBook.id}/download?format=${format}`, '_blank');
    },

    // Show toast notification
    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = type === 'success' ? '✅' : '❌';

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${this.escapeHtml(message)}</div>
        `;

        container.appendChild(toast);

        // Remove toast after 2 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 2000);
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
    },

    // Render polls
    renderPolls(polls) {
        const pollsSection = document.getElementById('pollsSection');
        if (!polls || polls.length === 0) {
            pollsSection.innerHTML = '';
            return;
        }

        pollsSection.innerHTML = polls.map(poll => {
            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes_count, 0);

            const optionsHTML = poll.options.map(option => {
                const percentage = totalVotes > 0 ? Math.round((option.votes_count / totalVotes) * 100) : 0;

                return `
                    <div class="poll-option ${poll.hasVoted ? 'poll-option-voted' : ''}" 
                         data-poll-id="${poll.id}" 
                         data-option-id="${option.id}"
                         ${!poll.hasVoted ? 'onclick="handlePollVote(this)"' : ''}>
                        ${poll.hasVoted ? `<div class="poll-option-bar" style="width: ${percentage}%"></div>` : ''}
                        <div class="poll-option-content">
                            <span class="poll-option-text">${this.escapeHtml(option.option_text)}</span>
                            ${poll.hasVoted ? `<span class="poll-option-votes">${percentage}% (${option.votes_count})</span>` : ''}
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="poll-card">
                    <h3 class="poll-question">📊 ${this.escapeHtml(poll.question)}</h3>
                    <div class="poll-options">
                        ${optionsHTML}
                    </div>
                    ${poll.hasVoted ? `<div class="poll-voted-badge">✓ Ya has votado</div>` : ''}
                    <div class="poll-total-votes">${totalVotes} votos totales</div>
                </div>
            `;
        }).join('');
    },

    // Load genres into select
    loadGenreSelect() {
        const genreSelect = document.getElementById('bookGenre');
        if (!genreSelect) return;

        genreSelect.innerHTML = '<option value="">Selecciona un género...</option>' +
            AppState.genres.map(genre => `
                <option value="${genre.id}">${this.escapeHtml(genre.name)}</option>
            `).join('');
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

            // Add genre_id
            const genreId = document.getElementById('bookGenre').value;
            if (genreId) {
                formData.append('genre_id', genreId);
            }

            const pdfFile = document.getElementById('bookFile').files[0];
            const docxFile = document.getElementById('bookDocx').files[0];
            const coverFile = document.getElementById('bookCover').files[0];

            if (pdfFile) formData.append('pdf', pdfFile);
            if (docxFile) formData.append('docx', docxFile);
            if (coverFile) formData.append('cover', coverFile);

            const result = await API.uploadBook(formData);

            if (result.success) {
                UIManager.showToast('¡Libro publicado exitosamente!', 'success');
                UIManager.closeUploadModal();
                await loadBooks();
            } else {
                UIManager.showToast(result.message || 'Error al publicar el libro', 'error');
            }
        } catch (error) {
            console.error('Error uploading book:', error);
            UIManager.showToast('Error al publicar el libro. Por favor intenta de nuevo.', 'error');
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

async function loadPolls() {
    const polls = await API.getPolls();
    AppState.polls = polls;
    UIManager.renderPolls(polls);
}

async function loadGenres() {
    const genres = await API.getGenres();
    AppState.genres = genres;
    UIManager.loadGenreSelect();
}

async function loadAdminStats() {
    const stats = await API.getAdminStats();
    if (stats) {
        document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
        document.getElementById('totalBooks').textContent = stats.totalBooks || 0;
    }
}

async function initializeApp() {
    // Initialize Theme
    ThemeManager.init();

    // Check authentication status
    const user = await API.checkAuth();

    // Force login if not authenticated
    if (!user) {
        window.location.href = '/auth/google';
        return;
    }

    AppState.user = user;
    AppState.isAuthenticated = !!user;

    // Update UI based on auth status
    UIManager.updateAuthUI(user);

    // If authenticated, load data
    if (user) {
        await loadGenres();
        await loadBooks();
        await loadPolls();
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
// Global function for delete button
window.deleteBook = async function (id) {
    if (confirm('¿Estás seguro de que quieres eliminar este libro? Esta acción no se puede deshacer.')) {
        const result = await API.deleteBook(id);
        if (result.success) {
            alert('Libro eliminado exitosamente');
            await loadBooks();
        } else {
            alert(result.message || 'Error al eliminar el libro');
        }
    }
};

// Global function for poll voting
// Global function for reporting inappropriate content
window.reportBook = async function (bookId, bookTitle) {
    const reasons = [
        'spam',
        'contenido_inapropiado',
        'copyright',
        'otro'
    ];

    const reasonText = prompt(
        `Reportar "${bookTitle}"\n\nSelecciona la razón:\n1. Spam\n2. Contenido inapropiado\n3. Violación de copyright\n4. Otro\n\nEscribe el número (1-4):`
    );

    if (!reasonText) return;

    const reasonIndex = parseInt(reasonText) - 1;
    if (reasonIndex < 0 || reasonIndex >= reasons.length) {
        alert('Opción inválida');
        return;
    }

    const reason = reasons[reasonIndex];
    const description = prompt('Descripción adicional (opcional):');

    const result = await API.reportContent(bookId, reason, description || '');

    if (result.success) {
        alert('✅ Reporte enviado exitosamente. Los administradores lo revisarán pronto.');
    } else {
        alert('❌ Error al enviar el reporte: ' + (result.message || 'Error desconocido'));
    }
};

window.handlePollVote = async function (element) {
    const pollId = element.dataset.pollId;
    const optionId = element.dataset.optionId;

    const result = await API.votePoll(pollId, optionId);

    if (result.success) {
        // Reload polls to show updated results
        await loadPolls();
    } else {
        alert(result.message || 'Error al registrar el voto');
    }
};

document.addEventListener('DOMContentLoaded', initializeApp);
