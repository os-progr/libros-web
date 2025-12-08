// ============================================
// SOCIAL FEATURES - Frontend
// Follows, Messages, Stats, Enhanced Profiles
// ============================================

const SocialFeatures = {
    currentConversationUserId: null,

    // ============================================
    // FOLLOW SYSTEM
    // ============================================

    async followUser(userId) {
        try {
            const response = await fetch(`/api/social/follow/${userId}`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                // Update UI
                this.updateFollowButton(userId, true);
                alert('✅ Ahora sigues a este usuario');
            } else {
                alert(data.message || 'Error al seguir usuario');
            }
        } catch (error) {
            console.error('Error following user:', error);
            alert('Error al seguir usuario');
        }
    },

    async unfollowUser(userId) {
        try {
            const response = await fetch(`/api/social/follow/${userId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                this.updateFollowButton(userId, false);
                alert('Dejaste de seguir a este usuario');
            } else {
                alert(data.message || 'Error al dejar de seguir');
            }
        } catch (error) {
            console.error('Error unfollowing user:', error);
            alert('Error al dejar de seguir');
        }
    },

    updateFollowButton(userId, isFollowing) {
        const btn = document.querySelector(`[data-follow-user="${userId}"]`);
        if (btn) {
            btn.textContent = isFollowing ? '✓ Siguiendo' : '+ Seguir';
            btn.classList.toggle('following', isFollowing);
            btn.onclick = () => isFollowing ? this.unfollowUser(userId) : this.followUser(userId);
        }
    },

    async checkFollowStatus(userId) {
        try {
            const response = await fetch(`/api/social/is-following/${userId}`, {
                credentials: 'include'
            });
            const data = await response.json();
            return data.isFollowing;
        } catch (error) {
            console.error('Error checking follow status:', error);
            return false;
        }
    },

    async toggleFollow(userId) {
        const isFollowing = await this.checkFollowStatus(userId);
        if (isFollowing) {
            await this.unfollowUser(userId);
        } else {
            await this.followUser(userId);
        }
    },

    async openUserProfile(userId) {
        // Open stats modal for this user
        await this.openStatsModal(userId);
    },

    async startConversationWith(userId, userName) {
        await this.openMessagesModal();
        // Wait a bit for modal to open
        setTimeout(() => {
            this.openConversation(userId, userName);
        }, 300);
    },

    // ============================================
    // MESSAGING SYSTEM
    // ============================================

    async openMessagesModal() {
        const modal = document.getElementById('messagesModal');
        modal.classList.add('active');
        await this.loadConversations();
    },

    closeMessagesModal() {
        const modal = document.getElementById('messagesModal');
        modal.classList.remove('active');
    },

    async loadConversations() {
        try {
            const response = await fetch('/api/social/conversations', {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                this.renderConversations(data.conversations);
                // Update message badge
                this.updateMessageBadge(data.conversations);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    },

    updateMessageBadge(conversations) {
        const badge = document.getElementById('messageBadge');
        if (!badge) return;

        // Count total unread messages
        const unreadCount = conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0);

        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    },

    async loadUnreadMessageCount() {
        try {
            const response = await fetch('/api/social/conversations', {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                this.updateMessageBadge(data.conversations);
            }
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    },

    renderConversations(conversations) {
        const list = document.getElementById('conversationsList');

        if (conversations.length === 0) {
            list.innerHTML = '<div class="empty-conversations">No tienes conversaciones</div>';
            return;
        }

        list.innerHTML = conversations.map(conv => `
            <div class="conversation-item" onclick="SocialFeatures.openConversation(${conv.user_id}, '${conv.name}')">
                <img src="${conv.picture}" alt="${conv.name}" class="conv-avatar">
                <div class="conv-info">
                    <div class="conv-name">${conv.name}</div>
                    <div class="conv-last-message">${conv.last_message || 'Sin mensajes'}</div>
                </div>
                ${conv.unread_count > 0 ? `<span class="unread-badge">${conv.unread_count}</span>` : ''}
            </div>
        `).join('');
    },

    async openConversation(userId, userName) {
        this.currentConversationUserId = userId;

        try {
            const response = await fetch(`/api/social/messages/${userId}`, {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                this.renderChat(data.messages, userName);
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    },

    renderChat(messages, userName) {
        const chatArea = document.getElementById('chatArea');

        chatArea.innerHTML = `
            <div class="chat-header">
                <h4>${userName}</h4>
            </div>
            <div class="chat-messages" id="chatMessages">
                ${messages.map(msg => `
                    <div class="message ${msg.sender_id === AppState.user.id ? 'sent' : 'received'}">
                        <div class="message-content">${msg.message}</div>
                        <div class="message-time">${this.formatTime(msg.created_at)}</div>
                    </div>
                `).join('')}
            </div>
            <div class="chat-input-area">
                <input type="text" id="messageInput" placeholder="Escribe un mensaje..." class="message-input">
                <button onclick="SocialFeatures.sendMessage()" class="btn btn-primary">Enviar</button>
            </div>
        `;

        // Scroll to bottom
        const messagesDiv = document.getElementById('chatMessages');
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    },

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();

        if (!message || !this.currentConversationUserId) return;

        try {
            const response = await fetch('/api/social/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    receiver_id: this.currentConversationUserId,
                    message: message
                })
            });

            const data = await response.json();

            if (data.success) {
                input.value = '';
                // Reload conversation
                const userName = document.querySelector('.chat-header h4').textContent;
                await this.openConversation(this.currentConversationUserId, userName);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    },

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Ahora';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        return date.toLocaleDateString();
    },

    // ============================================
    // STATISTICS
    // ============================================

    async openStatsModal(userId = null) {
        const modal = document.getElementById('statsModal');
        modal.classList.add('active');

        const targetUserId = userId || AppState.user.id;
        await this.loadStats(targetUserId);
    },

    closeStatsModal() {
        const modal = document.getElementById('statsModal');
        modal.classList.remove('active');
    },

    async loadStats(userId) {
        try {
            const response = await fetch(`/api/social/stats/${userId}`, {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                this.renderStats(data.stats);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },

    renderStats(stats) {
        const content = document.getElementById('statsContent');

        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">📚</div>
                    <div class="stat-value">${stats.booksUploaded}</div>
                    <div class="stat-label">Libros Publicados</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⬇️</div>
                    <div class="stat-value">${stats.booksDownloaded}</div>
                    <div class="stat-label">Libros Descargados</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-value">${stats.reviewsWritten}</div>
                    <div class="stat-label">Reseñas Escritas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-value">${stats.followers}</div>
                    <div class="stat-label">Seguidores</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">👤</div>
                    <div class="stat-value">${stats.following}</div>
                    <div class="stat-label">Siguiendo</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-value">${stats.totalDownloads}</div>
                    <div class="stat-label">Descargas Totales</div>
                </div>
            </div>

            <div class="stats-chart">
                <h4>Actividad Mensual (Últimos 6 Meses)</h4>
                <div class="chart-container">
                    ${this.renderActivityChart(stats.monthlyActivity)}
                </div>
            </div>
        `;
    },

    renderActivityChart(monthlyData) {
        if (!monthlyData || monthlyData.length === 0) {
            return '<p class="empty-chart">No hay datos de actividad</p>';
        }

        const maxCount = Math.max(...monthlyData.map(m => m.count));

        return `
            <div class="bar-chart">
                ${monthlyData.map(item => `
                    <div class="bar-item">
                        <div class="bar" style="height: ${(item.count / maxCount) * 100}%">
                            <span class="bar-value">${item.count}</span>
                        </div>
                        <div class="bar-label">${this.formatMonth(item.month)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    formatMonth(monthStr) {
        const [year, month] = monthStr.split('-');
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return months[parseInt(month) - 1];
    },

    // ============================================
    // ENHANCED PROFILE
    // ============================================

    async openEnhancedProfileModal() {
        const modal = document.getElementById('enhancedProfileModal');
        modal.classList.add('active');

        // Load current profile data
        const response = await fetch(`/api/profile/${AppState.user.id}`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            const profile = data.profile;
            document.getElementById('enhancedBio').value = profile.bio || '';
            document.getElementById('enhancedAboutMe').value = profile.about_me || '';
            document.getElementById('enhancedWebsite').value = profile.website || '';
            document.getElementById('enhancedLocation').value = profile.location || '';
            document.getElementById('enhancedTwitter').value = profile.social_twitter || '';
            document.getElementById('enhancedInstagram').value = profile.social_instagram || '';
            document.getElementById('enhancedFacebook').value = profile.social_facebook || '';
            document.getElementById('enhancedGenres').value = profile.favorite_genres || '';
            document.getElementById('enhancedReadingGoal').value = profile.reading_goal_yearly || '';
        }
    },

    closeEnhancedProfileModal() {
        const modal = document.getElementById('enhancedProfileModal');
        modal.classList.remove('active');
    },

    async saveEnhancedProfile(event) {
        event.preventDefault();

        const profileData = {
            bio: document.getElementById('enhancedBio').value,
            about_me: document.getElementById('enhancedAboutMe').value,
            website: document.getElementById('enhancedWebsite').value,
            location: document.getElementById('enhancedLocation').value,
            social_twitter: document.getElementById('enhancedTwitter').value,
            social_instagram: document.getElementById('enhancedInstagram').value,
            social_facebook: document.getElementById('enhancedFacebook').value,
            favorite_genres: document.getElementById('enhancedGenres').value,
            reading_goal_yearly: parseInt(document.getElementById('enhancedReadingGoal').value) || 0
        };

        try {
            const response = await fetch('/api/social/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ Perfil actualizado exitosamente');
                this.closeEnhancedProfileModal();
            } else {
                alert(data.message || 'Error al actualizar perfil');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error al actualizar perfil');
        }
    }
};

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Enhanced profile form submission
    const enhancedProfileForm = document.getElementById('enhancedProfileForm');
    if (enhancedProfileForm) {
        enhancedProfileForm.addEventListener('submit', (e) => SocialFeatures.saveEnhancedProfile(e));
    }

    // Message input enter key
    document.addEventListener('keypress', (e) => {
        if (e.target.id === 'messageInput' && e.key === 'Enter') {
            SocialFeatures.sendMessage();
        }
    });
});
