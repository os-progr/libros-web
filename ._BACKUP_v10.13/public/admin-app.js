// ============================================
// ADMIN PANEL - JAVASCRIPT
// Complete administration panel with analytics
// ============================================

let chart = null;

// ============================================
// API CLIENT FOR ADMIN
// ============================================
const AdminAPI = {
    baseURL: '',

    // Check authentication
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

    // Get dashboard stats
    async getDashboardStats() {
        try {
            const response = await fetch('/api/admin/dashboard', {
                credentials: 'include'
            });
            const data = await response.json();
            return data.success ? data.stats : null;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return null;
        }
    },

    // Get activity logs
    async getActivityLogs(limit = 50) {
        try {
            const response = await fetch(`/api/admin/activity-logs?limit=${limit}`, {
                credentials: 'include'
            });
            const data = await response.json();
            return data.success ? data.logs : [];
        } catch (error) {
            console.error('Error fetching activity logs:', error);
            return [];
        }
    },

    // Get traffic analytics
    async getVisitsAnalytics() {
        try {
            const response = await fetch('/api/admin/analytics/visits', {
                credentials: 'include'
            });
            const data = await response.json();
            return data.success ? data.visits : [];
        } catch (error) {
            console.error('Error fetching visits analytics:', error);
            return [];
        }
    },

    // Get top books
    async getTopBooks(limit = 10) {
        try {
            const response = await fetch(`/api/admin/analytics/top-books?limit=${limit}`, {
                credentials: 'include'
            });
            const data = await response.json();
            return data.success ? data.books : [];
        } catch (error) {
            console.error('Error fetching top books:', error);
            return [];
        }
    },

    // Get pending reports
    async getPendingReports() {
        try {
            const response = await fetch('/api/admin/reports/pending', {
                credentials: 'include'
            });
            const data = await response.json();
            return data.success ? data.reports : [];
        } catch (error) {
            console.error('Error fetching pending reports:', error);
            return [];
        }
    },

    // Resolve report
    async resolveReport(reportId, status) {
        try {
            const response = await fetch(`/api/admin/reports/${reportId}/resolve`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            return await response.json();
        } catch (error) {
            console.error('Error resolving report:', error);
            return { success: false };
        }
    },

    // Flag book
    async flagBook(bookId, reason) {
        try {
            const response = await fetch(`/api/admin/books/${bookId}/flag`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            });
            return await response.json();
        } catch (error) {
            console.error('Error flagging book:', error);
            return { success: false };
        }
    },

    // Unflag book
    async unflagBook(bookId) {
        try {
            const response = await fetch(`/api/admin/books/${bookId}/unflag`, {
                method: 'POST',
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            console.error('Error unflagging book:', error);
            return { success: false };
        }
    },

    // Get flagged books
    async getFlaggedBooks() {
        try {
            const response = await fetch('/api/admin/books/flagged', {
                credentials: 'include'
            });
            const data = await response.json();
            return data.success ? data.books : [];
        } catch (error) {
            console.error('Error fetching flagged books:', error);
            return [];
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
    }
};

// ============================================
// UI MANAGER
// ============================================
const AdminUI = {
    // Load dashboard statistics
    async loadDashboardStats() {
        const stats = await AdminAPI.getDashboardStats();

        if (stats) {
            document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
            document.getElementById('totalBooks').textContent = stats.totalBooks || 0;
            document.getElementById('todayVisits').textContent = stats.todayVisits || 0;
            document.getElementById('todayUniqueUsers').textContent =
                `${stats.todayUniqueUsers || 0} usuarios únicos`;
            document.getElementById('weekVisits').textContent = stats.weekVisits || 0;
            document.getElementById('weekUniqueUsers').textContent =
                `${stats.weekUniqueUsers || 0} usuarios únicos`;
            document.getElementById('pendingReports').textContent = stats.pendingReports || 0;
        }
    },

    // Load and render traffic chart
    async loadTrafficChart() {
        const visits = await AdminAPI.getVisitsAnalytics();

        if (visits && visits.length > 0) {
            const ctx = document.getElementById('trafficChart').getContext('2d');

            // Destroy existing chart if any
            if (chart) {
                chart.destroy();
            }

            const labels = visits.map(v => {
                const date = new Date(v.date);
                return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
            });
            const data = visits.map(v => v.visits);

            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Visitas',
                        data: data,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    },

    // Load top books
    async loadTopBooks() {
        const books = await AdminAPI.getTopBooks(10);
        const container = document.getElementById('topBooksList');

        if (books.length === 0) {
            container.innerHTML = '<p class="empty-message">No hay datos de visualizaciones aún</p>';
            return;
        }

        container.innerHTML = books.map((book, index) => `
            <div class="top-book-item">
                <span class="book-rank">#${index + 1}</span>
                <div class="book-info">
                    <h4>${this.escapeHtml(book.title)}</h4>
                    <p>por ${this.escapeHtml(book.author)}</p>
                </div>
                <span class="book-views">👁️ ${book.views} vistas</span>
            </div>
        `).join('');
    },

    // Load activity logs
    async loadActivityLogs() {
        const logs = await AdminAPI.getActivityLogs(50);
        const container = document.getElementById('activityLogsList');

        if (logs.length === 0) {
            container.innerHTML = '<p class="empty-message">No hay actividad registrada aún</p>';
            return;
        }

        container.innerHTML = logs.map(log => {
            const date = new Date(log.created_at);
            const timeAgo = this.getTimeAgo(date);

            return `
                <div class="activity-log-item">
                    <div class="log-icon">${this.getActionIcon(log.action)}</div>
                    <div class="log-content">
                        <div class="log-header">
                            <strong>${this.escapeHtml(log.user_name || 'Usuario')}</strong>
                            <span class="log-action">${this.getActionText(log.action)}</span>
                        </div>
                        ${log.details ? `<p class="log-details">${this.escapeHtml(log.details)}</p>` : ''}
                        <span class="log-time">${timeAgo}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Load pending reports
    async loadPendingReports() {
        const reports = await AdminAPI.getPendingReports();
        const container = document.getElementById('reportsList');

        if (reports.length === 0) {
            container.innerHTML = '<p class="empty-message">✅ No hay reportes pendientes</p>';
            return;
        }

        container.innerHTML = reports.map(report => {
            const date = new Date(report.created_at);
            const timeAgo = this.getTimeAgo(date);

            return `
                <div class="report-item">
                    <div class="report-header">
                        <span class="report-reason">${this.escapeHtml(report.reason)}</span>
                        <span class="report-time">${timeAgo}</span>
                    </div>
                    <div class="report-content">
                        <h4>📚 ${this.escapeHtml(report.book_title)}</h4>
                        <p>por ${this.escapeHtml(report.book_author)}</p>
                        ${report.description ? `<p class="report-description">${this.escapeHtml(report.description)}</p>` : ''}
                        <p class="report-reporter">Reportado por: ${this.escapeHtml(report.reporter_name)}</p>
                    </div>
                    <div class="report-actions">
                        <button class="btn btn-primary" onclick="resolveReport(${report.id}, 'resolved', ${report.book_id})">
                            ✓ Marcar y Resolver
                        </button>
                        <button class="btn btn-secondary" onclick="resolveReport(${report.id}, 'dismissed')">
                            ✗ Descartar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Load flagged books
    async loadFlaggedBooks() {
        const books = await AdminAPI.getFlaggedBooks();
        const container = document.getElementById('flaggedBooksList');

        if (books.length === 0) {
            container.innerHTML = '<p class="empty-message">✅ No hay libros marcados</p>';
            return;
        }

        container.innerHTML = books.map(book => {
            const date = new Date(book.flagged_at);
            const timeAgo = this.getTimeAgo(date);

            return `
                <div class="flagged-book-item">
                    <div class="book-header">
                        <h4>📚 ${this.escapeHtml(book.title)}</h4>
                        <span class="flagged-time">${timeAgo}</span>
                    </div>
                    <p>por ${this.escapeHtml(book.author)}</p>
                    <div class="flag-info">
                        <span class="flag-reason">🚩 Razón: ${this.escapeHtml(book.flag_reason)}</span>
                        <span class="flagged-by">Marcado por: ${this.escapeHtml(book.flagged_by_name || 'Admin')}</span>
                    </div>
                    <button class="btn btn-primary" onclick="unflagBook(${book.id})">
                        ✓ Desmarcar Libro
                    </button>
                </div>
            `;
        }).join('');
    },

    // Helper: Get action icon
    getActionIcon(action) {
        const icons = {
            'BOOK_FLAGGED': '🚩',
            'BOOK_UNFLAGGED': '✅',
            'REPORT_RESOLVED': '✓',
            'REPORT_CREATED': '📝',
            'BOOK_DELETED': '🗑️',
            'BOOK_CREATED': '📚'
        };
        return icons[action] || '📋';
    },

    // Helper: Get action text
    getActionText(action) {
        const texts = {
            'BOOK_FLAGGED': 'marcó un libro',
            'BOOK_UNFLAGGED': 'desmarcó un libro',
            'REPORT_RESOLVED': 'resolvió un reporte',
            'REPORT_CREATED': 'creó un reporte',
            'BOOK_DELETED': 'eliminó un libro',
            'BOOK_CREATED': 'publicó un libro'
        };
        return texts[action] || action.toLowerCase().replace('_', ' ');
    },

    // Helper: Get time ago
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        const intervals = {
            año: 31536000,
            mes: 2592000,
            semana: 604800,
            día: 86400,
            hora: 3600,
            minuto: 60
        };

        for (const [name, secondsInInterval] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInInterval);
            if (interval >= 1) {
                return `Hace ${interval} ${name}${interval > 1 ? 's' : ''}`;
            }
        }

        return 'Hace un momento';
    },

    // Helper: Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ============================================
// EVENT HANDLERS
// ============================================

// Resolve report
window.resolveReport = async function (reportId, status, bookId = null) {
    if (confirm(`¿Estás seguro de ${status === 'resolved' ? 'resolver' : 'descartar'} este reporte?`)) {
        // If resolving, optionally flag the book
        if (status === 'resolved' && bookId) {
            const reason = prompt('Ingresa la razón para marcar este libro:');
            if (reason) {
                await AdminAPI.flagBook(bookId, reason);
            }
        }

        const result = await AdminAPI.resolveReport(reportId, status);

        if (result.success) {
            alert('Reporte actualizado exitosamente');
            AdminUI.loadPendingReports();
            AdminUI.loadDashboardStats();
        } else {
            alert('Error al actualizar el reporte');
        }
    }
};

// Unflag book
window.unflagBook = async function (bookId) {
    if (confirm('¿Estás seguro de desmarcar este libro?')) {
        const result = await AdminAPI.unflagBook(bookId);

        if (result.success) {
            alert('Libro desmarcado exitosamente');
            AdminUI.loadFlaggedBooks();
        } else {
            alert('Error al desmarcar el libro');
        }
    }
};

// Tab switching
function setupTabs() {
    const tabs = document.querySelectorAll('.admin-tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            document.getElementById(`adminTab-${tabName}`).classList.add('active');

            // Load data for the tab
            loadTabData(tabName);
        });
    });
}

// Load data for specific tab
async function loadTabData(tabName) {
    switch (tabName) {
        case 'stats':
            await AdminUI.loadDashboardStats();
            await AdminUI.loadTrafficChart();
            await AdminUI.loadTopBooks();
            break;
        case 'activity':
            await AdminUI.loadActivityLogs();
            break;
        case 'reports':
            await AdminUI.loadPendingReports();
            break;
        case 'flagged':
            await AdminUI.loadFlaggedBooks();
            break;
    }
}

// ============================================
// INITIALIZATION
// ============================================
async function initAdminPanel() {
    // Check if user is admin
    const user = await AdminAPI.checkAuth();

    if (!user || !user.isAdmin) {
        alert('Acceso denegado. Solo administradores pueden acceder a este panel.');
        window.location.href = '/';
        return;
    }

    // Setup tabs
    setupTabs();

    // Load initial data (stats tab)
    await loadTabData('stats');

    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                const result = await AdminAPI.logout();
                if (result.success) {
                    window.location.href = '/';
                }
            }
        });
    }

    // Auto-refresh stats every 30 seconds
    setInterval(async () => {
        const activeTab = document.querySelector('.admin-tab.active');
        if (activeTab && activeTab.dataset.tab === 'stats') {
            await AdminUI.loadDashboardStats();
        }
    }, 30000);
}

// Start admin panel
document.addEventListener('DOMContentLoaded', initAdminPanel);
