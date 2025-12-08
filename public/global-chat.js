// ============================================
// GLOBAL CHAT - Public Chat Room Widget
// ============================================

const GlobalChat = {
    isOpen: false,
    messages: [],
    refreshInterval: null,
    initialized: false,

    init() {
        // Prevent double initialization
        if (this.initialized) return;

        console.log('🔄 Initializing Global Chat...');
        console.log('AppState:', AppState);
        console.log('isAuthenticated:', AppState?.isAuthenticated);

        // Only initialize if user is authenticated
        if (!AppState || !AppState.isAuthenticated) {
            console.log('❌ User not authenticated, hiding chat widget');
            const widget = document.getElementById('globalChatWidget');
            if (widget) {
                widget.style.display = 'none';
            }
            return;
        }

        console.log('✅ User authenticated, showing chat widget');
        const widget = document.getElementById('globalChatWidget');
        if (widget) {
            widget.style.display = 'flex';
        }

        this.initialized = true;
        this.setupEventListeners();
        this.loadMessages();

        // Auto-refresh every 5 seconds
        this.refreshInterval = setInterval(() => {
            if (this.isOpen) {
                this.loadMessages(true); // Silent refresh
            }
        }, 5000);
    },

    setupEventListeners() {
        const toggleBtn = document.getElementById('chatToggleBtn');
        const sendBtn = document.getElementById('chatSendBtn');
        const input = document.getElementById('globalChatInput');
        const header = document.getElementById('chatWidgetHeader');

        if (!toggleBtn || !sendBtn || !input || !header) {
            console.error('❌ Chat elements not found');
            return;
        }

        // Toggle chat
        const toggleHandler = (e) => {
            e.stopPropagation();
            this.toggleChat();
        };

        toggleBtn.addEventListener('click', toggleHandler);

        // Header button handler
        const headerBtn = document.getElementById('headerChatBtn');
        if (headerBtn) {
            headerBtn.addEventListener('click', toggleHandler);
        }

        header.addEventListener('click', (e) => {
            if (e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
                this.toggleChat();
            }
        });

        // Send message
        sendBtn.addEventListener('click', () => this.sendMessage());

        // Enter to send (Shift+Enter for new line)
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Character counter
        input.addEventListener('input', () => {
            const count = input.value.length;
            document.getElementById('chatCharCount').textContent = `${count}/500`;
        });

        console.log('✅ Chat event listeners set up');
    },

    toggleChat() {
        this.isOpen = !this.isOpen;
        const body = document.getElementById('chatWidgetBody');
        const icon = document.getElementById('chatToggleIcon');

        if (this.isOpen) {
            body.classList.remove('hidden');
            icon.textContent = '▲';
            this.loadMessages();
            this.scrollToBottom();
        } else {
            body.classList.add('hidden');
            icon.textContent = '▼';
        }
    },

    async loadMessages(silent = false) {
        try {
            const response = await fetch('/api/chat/messages', {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                this.messages = data.messages;
                this.renderMessages();
                this.updateMessageCount();

                if (!silent) {
                    this.scrollToBottom();
                }
            }
        } catch (error) {
            console.error('Error loading chat messages:', error);
            if (!silent) {
                const container = document.getElementById('globalChatMessages');
                if (container) {
                    container.innerHTML = '<div class="chat-error">Error al cargar mensajes</div>';
                }
            }
        }
    },

    renderMessages() {
        const container = document.getElementById('globalChatMessages');
        if (!container) return;

        if (this.messages.length === 0) {
            container.innerHTML = '<div class="chat-empty">No hay mensajes aún. ¡Sé el primero en escribir!</div>';
            return;
        }

        container.innerHTML = this.messages.map(msg => {
            const isOwn = AppState.user && msg.user_id === AppState.user.id;
            const time = this.formatTime(msg.created_at);

            return `
                <div class="chat-message ${isOwn ? 'own-message' : ''}">
                    <div class="chat-message-header">
                        <img src="${msg.user_picture || ''}" alt="${msg.user_name}" class="chat-avatar">
                        <span class="chat-username">${this.escapeHtml(msg.user_name)}</span>
                        <span class="chat-time">${time}</span>
                    </div>
                    <div class="chat-message-text">${this.escapeHtml(msg.message)}</div>
                </div>
            `;
        }).join('');
    },

    async sendMessage() {
        const input = document.getElementById('globalChatInput');
        const message = input.value.trim();

        if (!message) return;

        if (message.length > 500) {
            alert('El mensaje es demasiado largo (máximo 500 caracteres)');
            return;
        }

        try {
            const response = await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            if (data.success) {
                input.value = '';
                document.getElementById('chatCharCount').textContent = '0/500';
                await this.loadMessages();
                this.scrollToBottom();
            } else {
                alert(data.message || 'Error al enviar mensaje');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error al enviar mensaje');
        }
    },

    updateMessageCount() {
        const count = this.messages.length;

        // Update widget counter
        const countEl = document.getElementById('chatMessageCount');
        if (countEl) {
            countEl.textContent = count;
        }

        // Update header badge
        const headerBadge = document.getElementById('headerChatBadge');
        if (headerBadge) {
            headerBadge.textContent = count;
            headerBadge.classList.remove('hidden'); // Always show count if chat is active feature
        }
    },

    scrollToBottom() {
        const container = document.getElementById('globalChatMessages');
        if (container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 100);
        }
    },

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // Less than 1 minute
        if (diff < 60000) return 'Ahora';

        // Less than 1 hour
        if (diff < 3600000) {
            const mins = Math.floor(diff / 60000);
            return `${mins}m`;
        }

        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h`;
        }

        // More than 24 hours
        return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
};

// Try to initialize when AppState is ready
function tryInitGlobalChat() {
    if (typeof AppState !== 'undefined' && AppState.isAuthenticated) {
        console.log('✅ AppState ready, initializing chat');
        GlobalChat.init();
        return true;
    }
    return false;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, attempting to initialize chat...');

    // Try immediately
    if (!tryInitGlobalChat()) {
        // If not ready, try again after delays
        setTimeout(() => {
            if (!tryInitGlobalChat()) {
                setTimeout(() => tryInitGlobalChat(), 1500);
            }
        }, 500);
    }
});

// Also try when window loads (backup)
window.addEventListener('load', () => {
    if (!GlobalChat.initialized) {
        console.log('🔄 Window loaded, trying chat init again...');
        tryInitGlobalChat();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    GlobalChat.destroy();
});
