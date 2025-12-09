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
    isAuthenticated: false,
    libraryStatus: {},
    adminEmails: ['edaninguna@gmail.com'],

    isAdmin() {
        return this.user && this.adminEmails.includes(this.user.email.toLowerCase().trim());
    }
};



// ============================================
// DEVELOPER MODE MANAGER (Admin Only)
// ============================================
const DeveloperMode = {
    adminEmails: ['edaninguna@gmail.com', 'studyciberse@gmail.com'],

    init(user) {
        // Only show developer icon for admin
        if (user && this.adminEmails.includes(user.email)) {
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
// THEME MANAGER
// ============================================
const ThemeManager = {
    init() {
        // Check for saved theme preference or system preference
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.body.classList.add('dark-theme');
            this.updateIcon(true);
        } else {
            document.body.classList.remove('dark-theme');
            this.updateIcon(false);
        }
    },

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        this.updateIcon(isDark);
    },

    updateIcon(isDark) {
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.textContent = isDark ? '☀️' : '🌙';
        }
    }
}


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

    // Get reviews
    async getReviews(bookId) {
        try {
            const response = await fetch(`/api/reviews/book/${bookId}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching reviews:', error);
            return { success: false };
        }
    },

    // Add review
    async addReview(data) {
        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Error adding review:', error);
            return { success: false };
        }
    },

    // Get Profile
    async getProfile(userId) {
        try {
            const response = await fetch(`/api/profile/${userId}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching profile:', error);
            return { success: false };
        }
    },

    // Update Profile
    async updateProfile(data) {
        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating profile:', error);
            return { success: false };
        }
    },

    // Update Book Status (Shelves)
    async updateBookStatus(bookId, status) {
        try {
            const response = await fetch('/api/library/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId, status })
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating status:', error);
            return { success: false };
        }
    },

    // Get Library Statuses
    async getLibraryStatus() {
        try {
            const response = await fetch('/api/library/my-status');
            return await response.json();
        } catch (error) {
            console.error('Error getting statuses:', error);
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

            // Show admin button if user is admin
            const adminPanelBtn = document.getElementById('adminPanelBtn');
            if (adminPanelBtn) {
                if (AppState.isAdmin()) {
                    adminPanelBtn.classList.remove('hidden');
                } else {
                    adminPanelBtn.classList.add('hidden');
                }
            }
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

        const isAdmin = AppState.isAdmin();

        booksGrid.innerHTML = books.map(book => {
            // Use loose comparison (==) for IDs to match string/number types
            const canDelete = AppState.user && (book.user_id == AppState.user.id || isAdmin);
            const currentStatus = AppState.libraryStatus[book.id];

            return `
            <div class="book-card fade-in" data-book-id="${book.id}">
                ${canDelete ? `
                    <button class="book-delete-btn" onclick="event.stopPropagation(); UIManager.deleteBookFromLibrary(${book.id})" title="Eliminar libro">
                        🗑️
                    </button>
                ` : ''}
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
                    
                    <!-- Rating Stars -->
                    <div class="book-rating">
                        ${this.renderStars(book.avg_rating || 0)}
                        <span class="rating-text">${book.avg_rating ? book.avg_rating.toFixed(1) : '0.0'}</span>
                    </div>

                    <div class="book-meta">
                        <span class="download-badge download-allowed">
                            ✓ Descarga libre
                        </span>
                        ${book.created_at ? `<span class="book-date">📅 ${this.formatDate(book.created_at)}</span>` : ''}
                    </div>

                    <!-- Action Buttons -->
                    <div class="book-actions">
                        <select class="book-status-select" onclick="event.stopPropagation()" onchange="UIManager.handleStatusChange(this, ${book.id})" title="Estado de lectura">
                            <option value="none" ${!currentStatus ? 'selected' : ''}>📂 Estado</option>
                            <option value="want_to_read" ${currentStatus === 'want_to_read' ? 'selected' : ''}>⏳ Quiero leer</option>
                            <option value="reading" ${currentStatus === 'reading' ? 'selected' : ''}>📖 Leyendo</option>
                            <option value="read" ${currentStatus === 'read' ? 'selected' : ''}>✅ Leído</option>
                        </select>
                        <button class="book-action-btn" onclick="event.stopPropagation(); UIManager.openReviewModal(${book.id})" title="Ver reseñas">
                            ⭐ Reseñas
                        </button>

                        <button class="book-action-btn" onclick="event.stopPropagation(); UIManager.shareBook(${book.id}, '${this.escapeHtml(book.title)}')" title="Compartir">
                            📤 Compartir
                        </button>
                    </div>
                </div>
            </div>
        `}).join('');

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

    // Format date to readable format
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    },

    // Render star rating
    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        for (let i = 0; i < fullStars; i++) stars += '⭐';
        if (hasHalfStar) stars += '⭐';
        for (let i = 0; i < emptyStars; i++) stars += '☆';

        return `<span class="stars">${stars}</span>`;
    },

    // Update book rating dynamically
    updateBookRating(bookId, newAverage, newTotal) {
        // Update local state
        const book = AppState.books.find(b => b.id == bookId);
        if (book) {
            book.avg_rating = newAverage;
            if (newTotal) book.review_count = newTotal;
        }

        // Update Book Card UI
        const bookCard = document.querySelector(`.book-card[data-book-id="${bookId}"]`);
        if (bookCard) {
            const ratingContainer = bookCard.querySelector('.book-rating');
            if (ratingContainer) {
                // Animate change
                ratingContainer.innerHTML = `
                    ${this.renderStars(newAverage)}
                    <span class="rating-text rating-update-anim">${newAverage.toFixed(1)}</span>
                `;
            }
        }

        // Update Review Modal Summary if open
        const summaryRating = document.querySelector('#reviewBookSummary .mini-rating');
        if (summaryRating) {
            summaryRating.innerHTML = `${this.renderStars(newAverage)} (${newTotal || 0} reseñas)`;
            // Add pulse effect to summary too
            summaryRating.classList.add('rating-update-anim');
            setTimeout(() => summaryRating.classList.remove('rating-update-anim'), 600);
        }
    },

    // Share book on social media
    shareBook(bookId, bookTitle) {
        const url = `${window.location.origin}/?book=${bookId}`;
        const text = `¡Mira este libro: "${bookTitle}"!`;

        const shareOptions = [
            { name: 'WhatsApp', url: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, icon: '💬' },
            { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, icon: '📘' },
            { name: 'Twitter', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, icon: '🐦' },
            { name: 'Copiar enlace', action: 'copy', icon: '📋' }
        ];

        const modal = document.createElement('div');
        modal.className = 'share-modal-overlay';
        modal.innerHTML = `
            <div class="share-modal">
                <h3>Compartir libro</h3>
                <div class="share-options">
                    ${shareOptions.map(option => `
                        <button class="share-option-btn" data-url="${option.url || ''}" data-action="${option.action || 'open'}">
                            <span class="share-icon">${option.icon}</span>
                            <span>${option.name}</span>
                        </button>
                    `).join('')}
                </div>
                <button class="close-share-modal">Cerrar</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle share actions
        modal.querySelectorAll('.share-option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'copy') {
                    navigator.clipboard.writeText(url);
                    alert('✅ Enlace copiado al portapapeles');
                } else {
                    window.open(btn.dataset.url, '_blank');
                }
            });
        });

        // Close modal
        modal.querySelector('.close-share-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    // Open review modal
    async openReviewModal(bookId) {
        const book = AppState.books.find(b => b.id == bookId);
        if (!book) return;

        const modal = document.getElementById('reviewModal');
        const summary = document.getElementById('reviewBookSummary');
        const reviewsList = document.getElementById('reviewsList');
        const reviewForm = document.getElementById('reviewForm');

        // Update summary
        summary.innerHTML = `
            <div class="mini-cover">${book.cover_path ? `<img src="/api/books/${book.id}/cover">` : '📖'}</div>
            <div class="mini-info">
                <h4>${this.escapeHtml(book.title)}</h4>
                <p>by ${this.escapeHtml(book.author)}</p>
                <div class="mini-rating">${this.renderStars(book.avg_rating || 0)} (${book.review_count || 0} reseñas)</div>
            </div>
        `;

        // Reset form
        document.getElementById('reviewBookId').value = bookId;
        document.getElementById('reviewRating').value = '';
        document.getElementById('reviewText').value = '';
        this.resetStarRating();

        // Show/Hide write section based on auth and ownership
        const writeSection = document.getElementById('writeReviewSection');
        if (!AppState.user) {
            writeSection.classList.add('hidden');
        } else if (book.user_id === AppState.user.id) {
            writeSection.classList.add('hidden'); // Cannot review own book
            writeSection.innerHTML = '<p class="info-message">No puedes reseñar tu propio libro.</p>';
            writeSection.classList.remove('hidden');
        } else {
            writeSection.innerHTML = `
                <h3>Escribir Reseña</h3>
                <form id="reviewForm">
                    <input type="hidden" id="reviewBookId" value="${bookId}">
                    <div class="form-group">
                        <label class="form-label">Calificación</label>
                        <div class="star-rating-input" id="starRatingInput">
                            <span data-value="1">★</span>
                            <span data-value="2">★</span>
                            <span data-value="3">★</span>
                            <span data-value="4">★</span>
                            <span data-value="5">★</span>
                        </div>
                        <input type="hidden" id="reviewRating" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Tu Opinión</label>
                        <textarea class="form-textarea" id="reviewText" rows="3" 
                            placeholder="¿Qué te pareció este libro?" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Publicar Reseña</button>
                </form>
            `;
            writeSection.classList.remove('hidden');
            // Re-attach event listener
            document.getElementById('reviewForm').addEventListener('submit', EventHandlers.handleReviewSubmit);
            this.setupStarRating();
        }

        // Load reviews
        reviewsList.innerHTML = '<div class="loading-spinner">Cargando reseñas...</div>';
        modal.classList.add('active');

        const result = await API.getReviews(bookId);
        if (result.success) {
            this.renderReviews(result.reviews, result.stats);
        } else {
            reviewsList.innerHTML = '<p class="error-text">Error al cargar reseñas.</p>';
        }
    },

    // Render reviews list
    renderReviews(reviews, stats) {
        const list = document.getElementById('reviewsList');
        if (reviews.length === 0) {
            list.innerHTML = '<div class="empty-reviews">No hay reseñas todavía. ¡Sé el primero!</div>';
            return;
        }

        list.innerHTML = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="review-user" onclick="UIManager.openProfileModal(${review.user_id})" style="cursor: pointer;">
                        <img src="${review.user_picture || ''}" alt="User" class="review-avatar">
                        <span class="review-author-name">${this.escapeHtml(review.user_name)}</span>
                    </div>
                    <span class="review-date">${this.formatDate(review.created_at)}</span>
                </div>
                <div class="review-rating">
                    ${this.renderStars(review.rating)}
                </div>
                <div class="review-text">${this.escapeHtml(review.review_text)}</div>
                ${AppState.user && AppState.user.id === review.user_id ? `
                    <button class="delete-review-btn" onclick="UIManager.deleteReview(${review.id}, ${review.book_id})">Eliminar</button>
                ` : ''}
            </div>
        `).join('');
    },

    // Setup star rating input interaction
    setupStarRating() {
        const container = document.getElementById('starRatingInput');
        if (!container) return;

        const stars = container.querySelectorAll('span');
        const input = document.getElementById('reviewRating');

        stars.forEach(star => {
            star.addEventListener('click', () => {
                const value = star.dataset.value;
                input.value = value;
                this.updateStarVisuals(value);
            });
        });
    },

    updateStarVisuals(value) {
        const stars = document.querySelectorAll('#starRatingInput span');
        stars.forEach(s => {
            if (s.dataset.value <= value) s.classList.add('active');
            else s.classList.remove('active');
        });
    },

    resetStarRating() {
        this.updateStarVisuals(0);
    },

    // Open Profile Modal
    async openProfileModal(userId) {
        const modal = document.getElementById('profileModal');
        modal.classList.add('active');

        // Loading state
        document.getElementById('profileName').textContent = 'Cargando...';
        document.getElementById('profileBooksGrid').innerHTML = '<div class="loading">Cargando perfil...</div>';

        const result = await API.getProfile(userId);

        if (result.success) {
            const p = result.profile;
            document.getElementById('profileName').textContent = p.name;
            document.getElementById('profileImage').src = p.picture || '';

            document.getElementById('profileTotalBooks').textContent = p.stats.total_books;
            document.getElementById('profileTotalDownloads').textContent = p.stats.total_downloads;

            // Show edit button if own profile
            const editSection = document.getElementById('profileEditSection');
            if (editSection) {
                editSection.classList.add('hidden');
            }

            // Render books
            this.renderProfileBooks(p.books);
        }
    },

    openEditProfileModal(profile) {
        // Feature disabled
    },

    renderProfileBooks(books) {
        const grid = document.getElementById('profileBooksGrid');
        if (!books || books.length === 0) {
            grid.innerHTML = '<div class="empty-state-mini">No ha publicado libros aún.</div>';
            return;
        }

        grid.innerHTML = books.map(book => `
            <div class="book-card-mini" onclick="UIManager.openBookViewer(${book.id})">
                <div class="mini-cover">${book.cover_path ? `<img src="/api/books/${book.id}/cover">` : '📖'}</div>
                <div class="mini-details">
                    <div class="mini-title">${this.escapeHtml(book.title)}</div>
                </div>
            </div>
        `).join('');
    },

    // Generic Confirmation Modal
    showConfirmationModal(title, message, onConfirm) {
        const modal = document.getElementById('genericConfirmationModal');
        const titleEl = document.getElementById('confirmationTitle');
        const messageEl = document.getElementById('confirmationMessage');
        const confirmBtn = document.getElementById('confirmActionBtn');

        if (!modal) return; // Safety check

        titleEl.textContent = title;
        messageEl.textContent = message;
        messageEl.style.whiteSpace = 'pre-line'; // Respect newlines

        // Clone button to remove previous event listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newConfirmBtn.onclick = () => {
            onConfirm();
            this.closeConfirmationModal();
        };

        modal.classList.add('active');
    },

    closeConfirmationModal() {
        const modal = document.getElementById('genericConfirmationModal');
        if (modal) modal.classList.remove('active');
    },

    // Delete a review
    async deleteReview(reviewId, bookId) {
        this.showConfirmationModal(
            'Eliminar Reseña',
            '¿Estás seguro de que quieres eliminar esta reseña?',
            async () => {
                try {
                    const result = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
                    const data = await result.json();

                    if (data.success) {
                        // Refresh reviews
                        this.openReviewModal(bookId);
                    } else {
                        alert(data.message || 'Error al eliminar reseña');
                    }
                } catch (error) {
                    console.error('Error deleting review:', error);
                    alert('Error al eliminar reseña');
                }
            }
        );
    },

    // Delete book from library
    async deleteBookFromLibrary(bookId) {
        const book = AppState.books.find(b => b.id === bookId);
        const bookTitle = book ? book.title : 'este libro';

        this.showConfirmationModal(
            'Eliminar Libro',
            `¿Estás seguro de que quieres eliminar "${bookTitle}"?\n\nEsta acción no se puede deshacer.`,
            async () => {
                try {
                    const result = await API.deleteBook(bookId);

                    if (result.success) {
                        // Success toast or just reload
                        await loadBooks(); // Reload the books list
                    } else {
                        alert(`❌ Error: ${result.message || 'No se pudo eliminar el libro'}`);
                    }
                } catch (error) {
                    console.error('Error deleting book:', error);
                    alert('❌ Error al eliminar el libro');
                }
            }
        );
    },

    // Handle book status change
    async handleStatusChange(selectElement, bookId) {
        if (!AppState.isAuthenticated) {
            alert('Debes iniciar sesión para guardar libros en tu biblioteca.');
            selectElement.value = 'none'; // Reset
            return;
        }

        const status = selectElement.value;
        const originalText = selectElement.options[selectElement.selectedIndex].text;

        // Show loading indication
        selectElement.disabled = true;

        const result = await API.updateBookStatus(bookId, status);

        selectElement.disabled = false;

        if (result.success) {
            // Update local state
            AppState.libraryStatus[bookId] = status;
            // Optional: Show toast
        } else {
            alert(`Error al actualizar estado: ${result.message || 'Error desconocido'}`);
            // Revert
            selectElement.value = 'none';
        }
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
    handleLogout() {
        const modal = document.getElementById('logoutModal');
        if (modal) {
            modal.classList.add('active');

            const close = () => modal.classList.remove('active');

            // Setup handlers
            const closeBtn = document.getElementById('closeLogoutModal');
            const cancelBtn = document.getElementById('cancelLogout');
            const confirmBtn = document.getElementById('confirmLogout');

            if (closeBtn) closeBtn.onclick = close;
            if (cancelBtn) cancelBtn.onclick = close;

            if (confirmBtn) {
                confirmBtn.onclick = async () => {
                    const result = await API.logout();
                    if (result.success) {
                        window.location.reload();
                    }
                };
            }
        } else {
            // Fallback
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                API.logout().then(result => {
                    if (result.success) window.location.reload();
                });
            }
        }
    },

    // Handle review submission
    async handleReviewSubmit(e) {
        e.preventDefault();
        const bookId = document.getElementById('reviewBookId').value;
        const rating = document.getElementById('reviewRating').value;
        const text = document.getElementById('reviewText').value.trim();

        if (!rating) {
            alert('Por favor selecciona una calificación.');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        UIManager.showLoading(submitBtn);

        const result = await API.addReview({ book_id: bookId, rating, review_text: text });

        if (result.success) {
            UIManager.openReviewModal(bookId); // Reload reviews

            // Update rating on the book card with animation
            if (result.new_average !== undefined) {
                UIManager.updateBookRating(bookId, result.new_average, result.total_reviews);
            }
        } else {
            alert(result.message || 'Error al publicar reseña');
        }
        UIManager.hideLoading(submitBtn, originalText);
    },

    // Handle profile edit submission
    // Handle profile edit submission
    async handleEditProfileSubmit(e) {
        e.preventDefault();
        // Feature disabled
    }
};
async function loadBooks() {
    const books = await API.getBooks();

    // Load library statuses if authenticated
    if (AppState.isAuthenticated) {
        const statusResult = await API.getLibraryStatus();
        if (statusResult.success) {
            AppState.libraryStatus = statusResult.statuses || {};
        }
    }

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

    // Initialize Theme
    ThemeManager.init();

    // Update UI based on auth status
    UIManager.updateAuthUI(user);

    // If authenticated, load books
    if (user) {
        await loadBooks();
    } else {
        // Show welcome screen (handled by updateAuthUI)
        // window.location.href = '/auth/google';
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

    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => ThemeManager.toggleTheme());
    }

    document.getElementById('closeUploadModal').addEventListener('click', () => {
        UIManager.closeUploadModal();
    });

    // Upload form
    document.getElementById('uploadForm').addEventListener('submit', EventHandlers.handleUploadSubmit);

    // File inputs
    const bookFile = document.getElementById('bookFile');
    if (bookFile) bookFile.addEventListener('change', EventHandlers.handleFileChange);

    // Profile Edit Trigger (Moved to HTML onclick for reliability)

    const bookCover = document.getElementById('bookCover');
    if (bookCover) bookCover.addEventListener('change', EventHandlers.handleFileChange);

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


    // Admin Panel Button
    const adminPanelBtn = document.getElementById('adminPanelBtn');
    if (adminPanelBtn) {
        adminPanelBtn.addEventListener('click', () => {
            AdminPanel.open();
        });
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

            // Close other modals with Escape
            const reviewModal = document.getElementById('reviewModal');
            if (reviewModal.classList.contains('active')) reviewModal.classList.remove('active');

            const profileModal = document.getElementById('profileModal');
            if (profileModal.classList.contains('active')) profileModal.classList.remove('active');

            const editProfileModal = document.getElementById('editProfileModal');
            if (editProfileModal.classList.contains('active')) editProfileModal.classList.remove('active');
        }
    });

    // Review Modal Listeners
    const reviewModal = document.getElementById('reviewModal');
    if (reviewModal) {
        document.getElementById('closeReviewModal').addEventListener('click', () => {
            reviewModal.classList.remove('active');
        });
        reviewModal.addEventListener('click', (e) => {
            if (e.target === reviewModal) reviewModal.classList.remove('active');
        });
    }

    // Profile Modal Listeners
    const profileModal = document.getElementById('profileModal');
    if (profileModal) {
        document.getElementById('closeProfileModal').addEventListener('click', () => {
            profileModal.classList.remove('active');
        });
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) profileModal.classList.remove('active');
        });
    }

    // Edit Profile Modal Listeners
    const editProfileModal = document.getElementById('editProfileModal');
    if (editProfileModal) {
        document.getElementById('closeEditProfileModal').addEventListener('click', () => {
            editProfileModal.classList.remove('active');
        });
        document.getElementById('editProfileForm').addEventListener('submit', EventHandlers.handleEditProfileSubmit);
    }
}

// ============================================
// START APPLICATION
// ============================================
document.addEventListener('DOMContentLoaded', initializeApp);

// ============================================
// ADMIN PANEL MANAGER
// ============================================
const AdminPanel = {
    isOpen: false,

    init() {
        // Close button
        const closeBtn = document.getElementById('closeAdminPanel');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Close on outside click
        const modal = document.getElementById('adminPanel');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'adminPanel') {
                    this.close();
                }
            });
        }

        // Quick Actions
        const btnRefresh = document.getElementById('btnRefreshStats');
        if (btnRefresh) btnRefresh.addEventListener('click', () => this.loadStats());

        const btnClear = document.getElementById('btnClearCache');
        if (btnClear) btnClear.addEventListener('click', () => this.clearCache());

        const btnUsers = document.getElementById('btnViewUsers');
        if (btnUsers) btnUsers.addEventListener('click', () => this.viewUsers());

        const btnBooks = document.getElementById('btnViewAllBooks');
        if (btnBooks) btnBooks.addEventListener('click', () => this.viewBooks());
    },

    open() {
        const modal = document.getElementById('adminPanel');
        if (modal) {
            modal.classList.add('active');
            this.isOpen = true;
            this.loadStats();
        }
    },

    close() {
        const modal = document.getElementById('adminPanel');
        if (modal) {
            modal.classList.remove('active');
            this.isOpen = false;
        }
    },

    async loadStats() {
        try {
            const response = await fetch('/api/admin/stats');
            const data = await response.json();

            if (data.success) {
                this.updateUI(data.stats);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },

    updateUI(stats) {
        // Update counters with animation
        this.animateValue('statUsers', stats.totalUsers);
        this.animateValue('statBooks', stats.totalBooks);
        this.animateValue('statDownloadsToday', stats.downloadsToday);
        this.animateValue('statTotalDownloads', stats.totalDownloads);
        this.animateValue('statBooksToday', stats.newBooksToday);
        this.animateValue('statPendingReports', stats.pendingReports);

        // Update popular book
        const popularBookEl = document.getElementById('popularBook');
        if (popularBookEl) {
            if (stats.mostPopularBook) {
                popularBookEl.innerHTML = `
        < div class= "popular-book-icon" >🔥</div >
        <div class="popular-book-info">
            <div class="popular-book-title">${this.escapeHtml(stats.mostPopularBook.title)}</div>
            <div class="popular-book-subtitle">
                ${stats.mostPopularBook.download_count} descargas • por ${this.escapeHtml(stats.mostPopularBook.author)}
            </div>
        </div>
                `;
            } else {
                popularBookEl.innerHTML = `
            < div class= "popular-book-icon" > ℹ️</div >
        <div class="popular-book-info">
            <div class="popular-book-title">Sin datos</div>
            <div class="popular-book-subtitle">Aún no hay descargas</div>
        </div>
                `;
            }
        }
    },

    animateValue(id, value) {
        const element = document.getElementById(id);
        if (!element) return;

        const start = 0;
        const end = parseInt(value) || 0;
        const duration = 1000;
        const range = end - start;
        let current = start;
        const increment = end > start ? 1 : -1;
        const stepTime = Math.abs(Math.floor(duration / range));

        if (range === 0) {
            element.textContent = end;
            return;
        }

        const timer = setInterval(() => {
            current += increment;
            element.textContent = current;
            if (current == end) {
                clearInterval(timer);
            }
        }, Math.max(stepTime, 20)); // Min 20ms per step
    },

    async clearCache() {
        if (confirm('¿Estás seguro de limpiar la caché del sistema?')) {
            try {
                const response = await fetch('/api/admin/clear-cache', { method: 'POST' });
                const data = await response.json();
                if (data.success) {
                    alert('✅ Caché limpiado exitosamente');
                }
            } catch (error) {
                alert('❌ Error al limpiar caché');
            }
        }
    },

    viewUsers() {
        const modal = document.getElementById('usersModal');
        if (modal) {
            modal.classList.add('active');
            this.loadUsers();

            // Setup close button
            const closeBtn = document.getElementById('closeUsersModal');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    modal.classList.remove('active');
                };
            }

            // Close on outside click
            modal.onclick = (e) => {
                if (e.target.id === 'usersModal') {
                    modal.classList.remove('active');
                }
            };
        }
    },

    async loadUsers() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Cargando usuarios...</td></tr>';

        try {
            const response = await fetch('/api/admin/users');
            const data = await response.json();

            if (data.success) {
                this.renderUsers(data.users);
            } else {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Error al cargar usuarios</td></tr>';
            }
        } catch (error) {
            console.error('Error loading users:', error);
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Error de conexión</td></tr>';
        }
    },

    renderUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay usuarios registrados</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => `
            < tr >
                <td>
                    <div class="user-cell">
                        <img src="${user.picture || 'https://via.placeholder.com/32'}" alt="${this.escapeHtml(user.name)}">
                        <span class="user-name">${this.escapeHtml(user.name)}</span>
                    </div>
                </td>
                <td>${this.escapeHtml(user.email)}</td>
                <td>${user.books_count || 0}</td>
                <td>${user.downloads_count || 0}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    ${user.email !== 'edaninguna@gmail.com' ? `
                        <button class="action-btn btn-view" onclick="AdminPanel.openUserNotifyModal(${user.id}, '${this.escapeHtml(user.name)}')" title="Enviar Notificación">
                            🔔
                        </button>
                        <button class="action-btn btn-primary" onclick="AdminPanel.messageAuthor(${user.id}, '${this.escapeHtml(user.name)}')" title="Enviar Mensaje">
                            💬
                        </button>
                        <button class="action-btn btn-danger" onclick="AdminPanel.deleteUser(${user.id}, '${this.escapeHtml(user.name)}')">
                            🗑️ Eliminar
                        </button>
                    ` : '<span class="badge badge-admin">Admin</span>'}
                </td>
            </tr >
    `).join('');
    },

    async deleteUser(userId, userName) {
        if (confirm(`¿Estás seguro de que quieres eliminar al usuario "${userName}" ?\n\nEsta acción eliminará también todos sus libros y no se puede deshacer.`)) {
            try {
                const response = await fetch(`/ api / admin / users / ${userId} `, {
                    method: 'DELETE'
                });
                const data = await response.json();

                if (data.success) {
                    alert('✅ Usuario eliminado exitosamente');
                    this.loadUsers(); // Reload list
                    this.loadStats(); // Update stats
                } else {
                    alert(`❌ Error: ${data.message} `);
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('❌ Error al eliminar usuario');
            }
        }
    },

    viewBooks() {
        const modal = document.getElementById('booksModal');
        if (modal) {
            modal.classList.add('active');
            this.loadBooks();

            // Setup close button
            const closeBtn = document.getElementById('closeBooksModal');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    modal.classList.remove('active');
                };
            }

            // Close on outside click
            modal.onclick = (e) => {
                if (e.target.id === 'booksModal') {
                    modal.classList.remove('active');
                }
            };

            // Setup Search
            const searchInput = document.getElementById('adminBookSearch');
            if (searchInput) {
                searchInput.value = ''; // Reset
                searchInput.oninput = (e) => this.filterBooks(e.target.value);
            }
        }
    },

    async loadBooks() {
        const tbody = document.getElementById('booksTableBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Cargando libros...</td></tr>';

        try {
            const response = await fetch('/api/admin/books');
            const data = await response.json();

            if (data.success) {
                this.books = data.books; // Store for searching
                this.renderBooks(data.books);
            } else {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Error al cargar libros</td></tr>';
            }
        } catch (error) {
            console.error('Error loading books:', error);
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Error de conexión</td></tr>';
        }
    },

    filterBooks(query) {
        if (!this.books) return;

        query = query.toLowerCase();
        const filtered = this.books.filter(book =>
            book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query) ||
            (book.uploader_name && book.uploader_name.toLowerCase().includes(query))
        );
        this.renderBooks(filtered);
    },

    renderBooks(books) {
        const tbody = document.getElementById('booksTableBody');
        if (!tbody) return;

        if (books.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay libros registrados</td></tr>';
            return;
        }

        tbody.innerHTML = books.map(book => `
    < tr >
                <td>
                    <div class="book-title-cell" title="${this.escapeHtml(book.title)}">
                        ${this.escapeHtml(book.title)}
                    </div>
                </td>
                <td>
                    <div class="book-author-cell">
                        ${this.escapeHtml(book.author)}
                    </div>
                </td>
                <td>
                    <div class="uploader-info">
                        ${this.escapeHtml(book.uploader_name || 'Desconocido')}<br>
                        <small>${this.escapeHtml(book.uploader_email || '')}</small>
                    </div>
                </td>
                <td>${book.download_count || 0}</td>
                <td>
                    ${book.report_count > 0
                ? `<span class="badge badge-danger">${book.report_count} reportes</span>`
                : '<span class="badge badge-success">0</span>'}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn btn-edit" onclick="AdminPanel.openEditBook(${book.id})" title="Editar">
                            ✏️
                        </button>
                        <button class="action-btn btn-view" onclick="AdminPanel.openFeedbackModal(${book.id}, '${this.escapeHtml(book.title)}')" title="Enviar Recomendación">
                            📢
                        </button>
                        <button class="action-btn btn-primary" onclick="AdminPanel.messageAuthor(${book.user_id}, '${this.escapeHtml(book.uploader_name)}')" title="Enviar Mensaje">
                            💬
                        </button>
                        <button class="action-btn btn-danger" onclick="AdminPanel.deleteBook(${book.id})" title="Eliminar">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr >
    `).join('');
    },

    async deleteBook(bookId, bookTitle) {
        if (confirm(`¿Estás seguro de que quieres eliminar el libro "${bookTitle}" ?\n\nEsta acción no se puede deshacer.`)) {
            try {
                const response = await fetch(`/api/admin/books/${bookId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const data = await response.json();

                if (data.success) {
                    alert('✅ Libro eliminado exitosamente');
                    this.loadBooks(); // Reload list
                    this.loadStats(); // Update stats
                } else {
                    alert(`❌ Error: ${data.message} `);
                }
            } catch (error) {
                console.error('Error deleting book:', error);
                alert('❌ Error al eliminar libro');
            }
        }
    },

    // Store books data temporarily for editing
    booksData: [],

    openEditBook(bookId) {
        // Fetch book details first (or find in loaded list if we stored it)
        // For simplicity, we'll fetch the list again or use what we have
        // Ideally we should store the list in this.booksData when loading

        // Let's fetch the specific book details from the current table row is hard, 
        // so better to fetch from API or filter from a stored list.
        // Since we don't have a single book endpoint, we'll use the list endpoint again or rely on the DOM
        // A better approach: store books in memory when loading

        // Let's modify loadBooks to store data
        this.fetchAndEdit(bookId);
    },

    async fetchAndEdit(bookId) {
        try {
            const response = await fetch('/api/admin/books');
            const data = await response.json();

            if (data.success) {
                const book = data.books.find(b => b.id === bookId);
                if (book) {
                    this.showEditModal(book);
                }
            }
        } catch (error) {
            console.error('Error fetching book details:', error);
        }
    },

    showEditModal(book) {
        const modal = document.getElementById('editBookModal');
        const form = document.getElementById('editBookForm');

        if (modal && form) {
            document.getElementById('editBookId').value = book.id;
            document.getElementById('editBookTitle').value = book.title;
            document.getElementById('editBookAuthor').value = book.author;
            document.getElementById('editBookDescription').value = book.description || '';

            modal.classList.add('active');

            // Setup close handlers
            const closeBtn = document.getElementById('closeEditBookModal');
            const cancelBtn = document.getElementById('cancelEditBook');

            const close = () => modal.classList.remove('active');

            if (closeBtn) closeBtn.onclick = close;
            if (cancelBtn) cancelBtn.onclick = close;

            // Handle form submit
            form.onsubmit = async (e) => {
                e.preventDefault();
                await this.updateBook();
            };
        }
    },

    async updateBook() {
        const id = document.getElementById('editBookId').value;
        const title = document.getElementById('editBookTitle').value;
        const author = document.getElementById('editBookAuthor').value;
        const description = document.getElementById('editBookDescription').value;

        try {
            const response = await fetch(`/ api / admin / books / ${id} `, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, author, description })
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ Libro actualizado exitosamente');
                document.getElementById('editBookModal').classList.remove('active');
                this.loadBooks();
            } else {
                alert(`❌ Error: ${data.message} `);
            }
        } catch (error) {
            console.error('Error updating book:', error);
            alert('❌ Error al actualizar libro');
        }
    },

    openFeedbackModal(bookId, bookTitle) {
        const modal = document.getElementById('feedbackModal');
        const form = document.getElementById('feedbackForm');

        if (modal && form) {
            document.getElementById('feedbackBookId').value = bookId;
            document.getElementById('feedbackBookTitle').textContent = bookTitle;
            document.getElementById('feedbackMessage').value = '';

            modal.classList.add('active');

            // Setup close handlers
            const closeBtn = document.getElementById('closeFeedbackModal');
            const cancelBtn = document.getElementById('cancelFeedback');
            const close = () => modal.classList.remove('active');

            if (closeBtn) closeBtn.onclick = close;
            if (cancelBtn) cancelBtn.onclick = close;

            // Handle form submit
            form.onsubmit = async (e) => {
                e.preventDefault();
                await this.sendFeedback();
            };
        }
    },

    async sendFeedback() {
        const id = document.getElementById('feedbackBookId').value;
        const message = document.getElementById('feedbackMessage').value;
        const type = document.getElementById('feedbackType').value;

        try {
            const response = await fetch(`/ api / admin / books / ${id}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, type })
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ Recomendación enviada exitosamente');
                document.getElementById('feedbackModal').classList.remove('active');
            } else {
                alert(`❌ Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error sending feedback:', error);
            alert('❌ Error al enviar recomendación');
        }
    },

    messageAuthor(userId, userName) {
        // Use SocialFeatures to start a conversation with the author
        if (typeof SocialFeatures !== 'undefined') {
            SocialFeatures.startConversationWith(userId, userName);
        } else {
            alert('Sistema de mensajería no disponible');
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    openUserNotifyModal(userId, userName) {
        const modal = document.getElementById('userNotifyModal');
        const form = document.getElementById('userNotifyForm');

        if (modal && form) {
            document.getElementById('userNotifyUserId').value = userId;
            document.getElementById('userNotifyUserName').textContent = userName;
            document.getElementById('userNotifyMessage').value = '';
            document.getElementById('userNotifyTitle').value = '';

            modal.classList.add('active');

            // Setup close handlers
            const closeBtn = document.getElementById('closeUserNotifyModal');
            const cancelBtn = document.getElementById('cancelUserNotify');
            const close = () => modal.classList.remove('active');

            if (closeBtn) closeBtn.onclick = close;
            if (cancelBtn) cancelBtn.onclick = close;

            // Handle form submit
            form.onsubmit = async (e) => {
                e.preventDefault();
                await this.sendUserNotification();
            };
        }
    },

    async sendUserNotification() {
        const userId = document.getElementById('userNotifyUserId').value;
        const message = document.getElementById('userNotifyMessage').value;
        const title = document.getElementById('userNotifyTitle').value;
        const type = document.getElementById('userNotifyType').value;

        try {
            const response = await fetch(`/api/admin/users/${userId}/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, title, type })
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ Notificación enviada exitosamente');
                document.getElementById('userNotifyModal').classList.remove('active');
            } else {
                alert(`❌ Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error sending notification:', error);
            alert('❌ Error al enviar notificación');
        }
    }
};

// ============================================
// NOTIFICATIONS MANAGER
// ============================================
const NotificationsManager = {
    init() {
        const btn = document.getElementById('notificationBtn');
        const dropdown = document.getElementById('notificationsDropdown');
        const markAllBtn = document.getElementById('markAllReadBtn');

        if (btn && dropdown) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('hidden');
                if (!dropdown.classList.contains('hidden')) {
                    this.loadNotifications();
                }
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.add('hidden');
                }
            });
        }

        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => this.markAllAsRead());
        }

        // Poll for notifications every minute
        setInterval(() => this.checkCount(), 60000);
        this.checkCount(); // Initial check
    },

    async checkCount() {
        if (!AppState.isAuthenticated) return;

        try {
            const response = await fetch('/api/notifications');
            const data = await response.json();

            if (data.success) {
                this.updateBadge(data.unreadCount);
            }
        } catch (error) {
            console.error('Error checking notifications:', error);
        }
    },

    updateBadge(count) {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = count;
            if (count > 0) {
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    },

    async loadNotifications() {
        const list = document.getElementById('notificationsList');
        if (!list) return;

        list.innerHTML = '<div class="notification-item">Cargando...</div>';

        try {
            const response = await fetch('/api/notifications');
            const data = await response.json();

            if (data.success) {
                this.updateBadge(data.unreadCount);
                this.renderList(data.notifications);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            list.innerHTML = '<div class="notification-item">Error al cargar</div>';
        }
    },

    renderList(notifications) {
        const list = document.getElementById('notificationsList');
        if (!list) return;

        if (notifications.length === 0) {
            list.innerHTML = '<div class="empty-notifications">No tienes notificaciones</div>';
            return;
        }

        list.innerHTML = notifications.map(notif => `
            <div class="notification-item ${notif.is_read ? '' : 'unread'}" onclick="NotificationsManager.markAsRead(${notif.id})">
                <div class="notification-title ${this.getTypeClass(notif.type)}">
                    ${this.getTypeIcon(notif.type)} ${notif.title}
                </div>
                <div class="notification-message">${notif.message}</div>
                <div class="notification-date">${new Date(notif.created_at).toLocaleString()}</div>
            </div>
        `).join('');
    },

    getTypeClass(type) {
        return `notif-type-${type || 'info'}`;
    },

    getTypeIcon(type) {
        const icons = {
            info: 'ℹ️',
            warning: '⚠️',
            success: '✅',
            error: '❌'
        };
        return icons[type] || 'ℹ️';
    },

    async markAsRead(id) {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
            this.checkCount(); // Refresh badge
            this.loadNotifications(); // Refresh list to remove unread style
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    },

    async markAllAsRead() {
        try {
            await fetch('/api/notifications/read-all', { method: 'PUT' });
            this.checkCount();
            this.loadNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }
};

// Redefine DeveloperMode.init to use AdminPanel
DeveloperMode.init = function (user) {
    // Initialize Admin Panel
    if (typeof AdminPanel !== 'undefined') {
        AdminPanel.init();
    }

    // Initialize Notifications
    if (typeof NotificationsManager !== 'undefined') {
        NotificationsManager.init();
    }

    // Only show developer icon for admin
    if (user && this.adminEmails.includes(user.email)) {
        const developerToggle = document.getElementById('developerToggle');
        if (developerToggle) {
            developerToggle.classList.remove('hidden');

            // Click opens Admin Panel
            developerToggle.addEventListener('click', () => {
                if (typeof AdminPanel !== 'undefined') {
                    AdminPanel.open();
                }
            });

            // Right click toggles Dev Tools access
            developerToggle.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.toggleDevMode();
            });
        }
    }

    // Load saved developer mode state
    const devMode = localStorage.getItem('developerMode') === 'true';
    if (devMode) {
        this.enableDevMode();
    }
};
