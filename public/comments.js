// ============================================
// COMMENTS SYSTEM - Frontend
// ============================================

const CommentsSystem = {
    currentBookId: null,
    replyingTo: null,

    async openCommentsModal(bookId, bookTitle) {
        this.currentBookId = bookId;
        const modal = document.getElementById('commentsModal');

        if (modal) {
            document.getElementById('commentsBookTitle').textContent = bookTitle;
            modal.classList.add('active');
            await this.loadComments(bookId);
        }
    },

    closeCommentsModal() {
        const modal = document.getElementById('commentsModal');
        if (modal) {
            modal.classList.remove('active');
            this.currentBookId = null;
            this.replyingTo = null;
        }
    },

    async loadComments(bookId) {
        try {
            const response = await fetch(`/api/comments/book/${bookId}`, {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success) {
                this.renderComments(data.comments);
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    },

    renderComments(comments) {
        const container = document.getElementById('commentsContainer');

        if (comments.length === 0) {
            container.innerHTML = '<div class="empty-comments">No hay comentarios aún. ¡Sé el primero en comentar!</div>';
            return;
        }

        container.innerHTML = comments.map(comment => this.renderComment(comment)).join('');
    },

    renderComment(comment, isReply = false) {
        const canDelete = AppState.user && (comment.user_id === AppState.user.id || AppState.user.email === 'edaninguna@gmail.com');
        const canEdit = AppState.user && comment.user_id === AppState.user.id;

        return `
            <div class="comment ${isReply ? 'comment-reply' : ''}" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <img src="${comment.user_picture}" alt="${comment.user_name}" class="comment-avatar">
                    <div class="comment-meta">
                        <span class="comment-author">${comment.user_name}</span>
                        <span class="comment-date">${this.formatDate(comment.created_at)}</span>
                    </div>
                    ${canDelete || canEdit ? `
                        <div class="comment-actions">
                            ${canEdit ? `
                                <button class="comment-action-btn" onclick="CommentsSystem.editComment(${comment.id}, '${this.escapeHtml(comment.comment_text)}')" title="Editar">
                                    ✏️
                                </button>
                            ` : ''}
                            ${canDelete ? `
                                <button class="comment-action-btn" onclick="CommentsSystem.deleteComment(${comment.id})" title="Eliminar">
                                    🗑️
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="comment-body">
                    <p class="comment-text">${this.escapeHtml(comment.comment_text)}</p>
                </div>
                <div class="comment-footer">
                    <button class="comment-like-btn ${comment.user_has_liked ? 'liked' : ''}" onclick="CommentsSystem.toggleLike(${comment.id})">
                        <span class="like-icon">${comment.user_has_liked ? '❤️' : '🤍'}</span>
                        <span class="like-count">${comment.like_count || 0}</span>
                    </button>
                    <button class="comment-reply-btn" onclick="CommentsSystem.startReply(${comment.id}, '${comment.user_name}')">
                        💬 Responder
                    </button>
                </div>
                ${comment.replies && comment.replies.length > 0 ? `
                    <div class="comment-replies">
                        ${comment.replies.map(reply => this.renderComment(reply, true)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    },

    async postComment() {
        const textarea = document.getElementById('commentInput');
        const text = textarea.value.trim();

        if (!text) {
            alert('Por favor escribe un comentario');
            return;
        }

        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    book_id: this.currentBookId,
                    comment_text: text,
                    parent_comment_id: this.replyingTo
                })
            });

            const data = await response.json();

            if (data.success) {
                textarea.value = '';
                this.cancelReply();
                await this.loadComments(this.currentBookId);
            } else {
                alert(data.message || 'Error al publicar comentario');
            }
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Error al publicar comentario');
        }
    },

    startReply(commentId, userName) {
        this.replyingTo = commentId;
        const textarea = document.getElementById('commentInput');
        const replyIndicator = document.getElementById('replyIndicator');

        textarea.focus();
        replyIndicator.innerHTML = `
            <span>Respondiendo a <strong>${userName}</strong></span>
            <button onclick="CommentsSystem.cancelReply()">✕</button>
        `;
        replyIndicator.classList.remove('hidden');
    },

    cancelReply() {
        this.replyingTo = null;
        const replyIndicator = document.getElementById('replyIndicator');
        replyIndicator.classList.add('hidden');
        replyIndicator.innerHTML = '';
    },

    async toggleLike(commentId) {
        try {
            const response = await fetch(`/api/comments/${commentId}/like`, {
                method: 'POST',
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                await this.loadComments(this.currentBookId);
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    },

    async deleteComment(commentId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
            return;
        }

        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                await this.loadComments(this.currentBookId);
            } else {
                alert(data.message || 'Error al eliminar comentario');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Error al eliminar comentario');
        }
    },

    async editComment(commentId, currentText) {
        const newText = prompt('Editar comentario:', currentText);

        if (newText === null || newText.trim() === '') {
            return;
        }

        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ comment_text: newText.trim() })
            });

            const data = await response.json();

            if (data.success) {
                await this.loadComments(this.currentBookId);
            } else {
                alert(data.message || 'Error al editar comentario');
            }
        } catch (error) {
            console.error('Error editing comment:', error);
            alert('Error al editar comentario');
        }
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'Ahora';
        if (minutes < 60) return `Hace ${minutes}m`;
        if (hours < 24) return `Hace ${hours}h`;
        if (days < 7) return `Hace ${days}d`;

        return date.toLocaleDateString();
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    const commentInput = document.getElementById('commentInput');
    if (commentInput) {
        commentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                CommentsSystem.postComment();
            }
        });
    }
});
