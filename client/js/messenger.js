// Messenger JavaScript
const MessengerRequest = {
    // Expose init function
    init: function (containerId) {
        // Check authentication
        if (!requireAuth()) return;

        // Initialize state
        let currentConversation = null;
        let conversations = [];
        let messages = [];
        let selectedFile = null;

        // Connect to server if not connected
        if (!medClient.isConnected) {
            medClient.connect();
        }

        // DOM elements - Look within the container if provided, else document
        const container = containerId ? document.getElementById(containerId) : document;

        const conversationsList = container.querySelector('#conversationsList');
        const messagesContainer = container.querySelector('#messagesContainer');
        const messageInput = container.querySelector('#messageInput');
        const sendBtn = container.querySelector('#sendBtn');
        const newChatBtn = container.querySelector('#newChatBtn');
        const newChatModal = container.querySelector('#newChatModal'); // Assuming modal might be outside or inside
        const userSelect = container.querySelector('#userSelect');
        const fileInput = container.querySelector('#fileInput');
        const fileUploadArea = container.querySelector('#fileUploadArea');
        const fileName = container.querySelector('#fileName');
        const removeFileBtn = container.querySelector('#removeFileBtn');
        const chatHeader = container.querySelector('#chatHeader');
        const messageInputArea = container.querySelector('#messageInputArea');
        const searchConversations = container.querySelector('#searchConversations');
        const cancelNewChatBtn = container.querySelector('#cancelNewChat');
        const startNewChatBtn = container.querySelector('#startNewChat');

        // Verify key elements exist before proceeding
        if (!conversationsList || !messagesContainer) {
            console.error('Messenger elements not found in container');
            return;
        }

        // Load initial data
        loadConversations();
        loadUsers();

        // Auto-refresh conversations every 30 seconds
        const refreshInterval = setInterval(loadConversations, 30000);

        // Store interval to clear it later if needed (e.g. when tab changes)
        // For now, we attach it to the container for simple cleanup
        container.dataset.messengerInterval = refreshInterval;

        // Event listeners
        if (sendBtn) sendBtn.addEventListener('click', sendMessage);

        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
            // Auto-resize textarea
            messageInput.addEventListener('input', function () {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 120) + 'px';
            });
        }

        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                if (newChatModal) newChatModal.classList.remove('hidden');
            });
        }

        if (cancelNewChatBtn) {
            cancelNewChatBtn.addEventListener('click', () => {
                if (newChatModal) newChatModal.classList.add('hidden');
                if (userSelect) userSelect.value = '';
            });
        }

        if (startNewChatBtn) {
            startNewChatBtn.addEventListener('click', () => {
                const selectedUserId = userSelect ? userSelect.value : null;
                if (selectedUserId) {
                    startNewConversation(selectedUserId);
                }
            });
        }

        // File upload handlers
        const attachBtn = container.querySelector('.attach-btn');
        if (attachBtn && fileInput) {
            attachBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    selectedFile = file;
                    if (fileName) fileName.textContent = file.name;
                    if (fileUploadArea) fileUploadArea.style.display = 'block';
                }
            });
        }

        if (removeFileBtn) {
            removeFileBtn.addEventListener('click', () => {
                selectedFile = null;
                if (fileInput) fileInput.value = '';
                if (fileName) fileName.textContent = 'No file selected';
                if (fileUploadArea) fileUploadArea.style.display = 'none';
            });
        }

        // Search conversations
        if (searchConversations) {
            searchConversations.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                filterConversations(searchTerm);
            });
        }

        // Functions
        async function loadConversations() {
            try {
                // Check if element still exists (tab might have changed)
                if (!document.contains(conversationsList)) {
                    clearInterval(refreshInterval);
                    return;
                }

                const response = await fetch('/api/messenger/conversations', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    conversations = data.conversations;
                    renderConversations();
                }
            } catch (error) {
                console.error('Error loading conversations:', error);
            }
        }

        async function loadUsers() {
            try {
                // Get users based on role
                let endpoint = '/api/admin/users';
                if (medClient.currentUser.role === 'Doctor') {
                    // For doctors, we'd need a specific endpoint to get patients and other doctors
                    endpoint = '/api/patients'; // This would need to be implemented
                }

                const response = await fetch(endpoint, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const users = data.users || data.patients || [];

                    if (userSelect) {
                        // Populate user select (exclude current user)
                        userSelect.innerHTML = '<option value="">Choose a user...</option>';
                        users.forEach(user => {
                            if (user.user_id !== medClient.currentUser.id) {
                                const option = document.createElement('option');
                                option.value = user.user_id;
                                option.textContent = `${user.name} (${user.role})`;
                                userSelect.appendChild(option);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading users:', error);
            }
        }

        function renderConversations() {
            if (!conversationsList) return;
            conversationsList.innerHTML = '';

            if (conversations.length === 0) {
                conversationsList.innerHTML = `
                    <div class="p-4 text-center text-gray-500">
                        <span class="material-symbols-outlined text-2xl mb-2">chat</span>
                        <p>No conversations yet</p>
                    </div>
                `;
                return;
            }

            conversations.forEach(conv => {
                const conversationEl = document.createElement('div');
                conversationEl.className = 'p-4 hover:bg-gray-50/5 cursor-pointer border-b border-gray-100/10 transition-colors';
                conversationEl.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                            <span class="material-symbols-outlined text-white text-sm">person</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between">
                                <h4 class="font-medium text-gray-200 truncate">${conv.otherParticipant.name}</h4>
                                <span class="text-xs text-gray-500">${formatTime(conv.updatedAt)}</span>
                            </div>
                            <p class="text-sm text-gray-400 truncate">${conv.lastMessage || 'No messages yet'}</p>
                        </div>
                    </div>
                `;

                conversationEl.addEventListener('click', () => {
                    selectConversation(conv);
                });

                conversationsList.appendChild(conversationEl);
            });
        }

        function filterConversations(searchTerm) {
            const filteredConversations = conversations.filter(conv =>
                conv.otherParticipant.name.toLowerCase().includes(searchTerm) ||
                (conv.lastMessage && conv.lastMessage.toLowerCase().includes(searchTerm))
            );

            // Temporarily replace conversations array and re-render
            const originalConversations = conversations;
            conversations = filteredConversations;
            renderConversations();
            conversations = originalConversations;
        }

        async function selectConversation(conversation) {
            currentConversation = conversation;

            // Update chat header
            const currentChatName = container.querySelector('#currentChatName');
            const currentChatStatus = container.querySelector('#currentChatStatus');

            if (currentChatName) currentChatName.textContent = conversation.otherParticipant.name;
            if (currentChatStatus) currentChatStatus.textContent = `${conversation.otherParticipant.role} • Online`;

            // Show message input area
            if (messageInputArea) messageInputArea.style.display = 'block';

            // Load messages
            await loadMessages(conversation.conversationId);

            // Highlight selected conversation
            container.querySelectorAll('#conversationsList > div').forEach((el, index) => {
                if (conversations[index] === conversation) {
                    el.classList.add('bg-primary/10', 'border-l-4', 'border-primary');
                } else {
                    el.classList.remove('bg-primary/10', 'border-l-4', 'border-primary');
                }
            });
        }

        async function loadMessages(conversationId) {
            try {
                const response = await fetch(`/api/messenger/conversations/${conversationId}/messages`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    messages = data.messages;
                    renderMessages();
                }
            } catch (error) {
                console.error('Error loading messages:', error);
            }
        }

        function renderMessages() {
            if (!messagesContainer) return;
            messagesContainer.innerHTML = '';

            if (messages.length === 0) {
                messagesContainer.innerHTML = `
                    <div class="flex items-center justify-center h-full text-gray-500">
                        <div class="text-center">
                            <span class="material-symbols-outlined text-4xl mb-2">chat</span>
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    </div>
                `;
                return;
            }

            const messagesGrouped = groupMessagesByDate(messages);

            Object.keys(messagesGrouped).forEach(date => {
                // Add date separator
                const dateSeparator = document.createElement('div');
                dateSeparator.className = 'flex items-center justify-center my-4';
                dateSeparator.innerHTML = `
                    <span class="px-3 py-1 bg-gray-200/10 text-gray-400 text-xs rounded-full">${date}</span>
                `;
                messagesContainer.appendChild(dateSeparator);

                // Add messages for this date
                messagesGrouped[date].forEach(message => {
                    const messageEl = createMessageElement(message);
                    messagesContainer.appendChild(messageEl);
                });
            });

            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function createMessageElement(message) {
            const isOwn = message.sender_id === medClient.currentUser.id;
            const messageEl = document.createElement('div');
            messageEl.className = `flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`;

            let messageContent = `
                <div class="message-bubble ${isOwn ? 'bg-primary text-black' : 'bg-darker border border-gray-700 text-gray-200'} rounded-lg px-4 py-2 max-w-[80%]">
                    ${message.message_type === 'file' ? createFileAttachment(message) : `<p class="text-sm">${message.message}</p>`}
                    <div class="text-xs ${isOwn ? 'text-black/60' : 'text-gray-500'} mt-1 text-right">
                        ${formatTime(message.created_at)}
                    </div>
                </div>
            `;

            messageEl.innerHTML = messageContent;
            return messageEl;
        }

        function createFileAttachment(message) {
            return `
                <div class="file-attachment rounded p-3 mb-2 bg-black/10">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined">description</span>
                        <div class="flex-1 overflow-hidden">
                            <p class="text-sm font-medium truncate">${message.file_name}</p>
                            <p class="text-xs opacity-75">${formatFileSize(message.file_size)}</p>
                        </div>
                        <button onclick="downloadFile(${message.message_id})" class="p-1 hover:bg-black/20 rounded">
                            <span class="material-symbols-outlined text-sm">download</span>
                        </button>
                    </div>
                </div>
                ${message.message ? `<p class="text-sm mt-2">${message.message}</p>` : ''}
            `;
        }

        async function sendMessage() {
            const messageText = messageInput.value.trim();
            if (!messageText && !selectedFile) return;
            if (!currentConversation) return;

            // Find receiver ID
            const receiverId = findReceiverId(currentConversation);
            if (!receiverId) return;

            try {
                const formData = new FormData();
                formData.append('receiverId', receiverId);
                formData.append('message', messageText);

                if (selectedFile) {
                    formData.append('file', selectedFile);
                }

                const response = await fetch('/api/messenger/send', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                });

                if (response.ok) {
                    // Clear input
                    messageInput.value = '';
                    selectedFile = null;
                    if (fileInput) fileInput.value = '';
                    if (fileName) fileName.textContent = 'No file selected';
                    if (fileUploadArea) fileUploadArea.style.display = 'none';

                    // Reload messages
                    await loadMessages(currentConversation.conversationId);
                    await loadConversations();

                    // showNotification('Message sent', 'success');
                } else {
                    showNotification('Failed to send message', 'error');
                }
            } catch (error) {
                console.error('Error sending message:', error);
                showNotification('Failed to send message', 'error');
            }
        }

        async function startNewConversation(userId) {
            // Check if conversation already exists (client-side check for UX)
            const existing = conversations.find(c => c.otherParticipant.id == userId);
            /* if (existing) { // logic needs user ID in otherParticipant
                selectConversation(existing);
             } */

            showNotification('New conversation started', 'info');
            if (newChatModal) newChatModal.classList.add('hidden');
            if (userSelect) userSelect.value = '';

            // Reload to be safe
            await loadConversations();
        }

        function findReceiverId(conversation) {
            if (conversation.otherParticipant.id) return conversation.otherParticipant.id;

            // Fallback: conversation object has participant1_id and participant2_id
            const myId = medClient.currentUser.id;
            if (conversation.participant1_id === myId) return conversation.participant2_id;
            return conversation.participant1_id;
        }

        function groupMessagesByDate(messages) {
            const grouped = {};
            messages.forEach(message => {
                const date = new Date(message.created_at).toLocaleDateString(); // Simple formatting
                if (!grouped[date]) {
                    grouped[date] = [];
                }
                grouped[date].push(message);
            });
            return grouped;
        }

        // Global function for file download
        window.downloadFile = async function (messageId) {
            try {
                const response = await fetch(`/api/messenger/download/${messageId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'download'; // Content-Disposition header usually handles name
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } else {
                    showNotification('Failed to download file', 'error');
                }
            } catch (error) {
                console.error('Error downloading file:', error);
                showNotification('Failed to download file', 'error');
            }
        };
    }
};

// expose globally
window.Messenger = MessengerRequest;

// Also auto-initialize on messenger page
if (window.location.pathname.includes('messenger.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        // Check authentication
        if (!requireAuth()) return;

        // Set user info
        if (medClient.currentUser) {
            document.getElementById('userName').textContent = medClient.currentUser.name;
            document.getElementById('userRole').textContent = medClient.currentUser.role;
        }

        // Initialize messenger
        MessengerRequest.init();
    });
}
