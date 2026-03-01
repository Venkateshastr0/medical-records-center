// Lawyer Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    if (!requireAuth()) return;

    // Initialize
    let currentPage = 'overview';
    let cases = [];
    let accessRequests = [];

    // Connect to server
    medClient.connect();

    // DOM elements
    const pageContent = document.getElementById('pageContent');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');

    // Set user name
    if (medClient.currentUser) {
        userName.textContent = medClient.currentUser.name;
    }

    // Load initial data
    loadDashboardData();

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page) {
                setActiveNav(page);
                loadPage(page);
            }
        });
    });

    // Event listeners
    logoutBtn.addEventListener('click', () => medClient.logout());

    // Functions
    function setActiveNav(page) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('bg-primary/10', 'text-primary');
            item.classList.add('hover:bg-gray-100');
        });

        const activeItem = document.querySelector(`[data-page="${page}"]`);
        if (activeItem) {
            activeItem.classList.add('bg-primary/10', 'text-primary');
            activeItem.classList.remove('hover:bg-gray-100');
        }

        currentPage = page;
        updatePageHeader(page);
    }

    function updatePageHeader(page) {
        const headers = {
            overview: {
                title: 'Overview',
                subtitle: 'Legal case management and medical records access'
            },
            cases: {
                title: 'Legal Cases',
                subtitle: 'Manage your active legal cases and client files'
            },
            requests: {
                title: 'Access Requests',
                subtitle: 'Track and manage medical record access requests'
            },
            documents: {
                title: 'Documents',
                subtitle: 'Legal document repository and templates'
            },
            audit: {
                title: 'Audit Log',
                subtitle: 'View system activity and access logs'
            },
            messenger: {
                title: 'Messenger',
                subtitle: 'Secure communication channel'
            }
        };

        const header = headers[page] || headers.overview;
        document.getElementById('pageTitle').textContent = header.title;
        document.getElementById('pageSubtitle').textContent = header.subtitle;
    }

    function loadPage(page) {
        switch (page) {
            case 'overview':
                loadOverview();
                break;
            case 'cases':
                loadCases();
                break;
            case 'requests':
                loadAccessRequests();
                break;
            case 'documents':
                loadDocuments();
                break;
            case 'audit':
                loadAudit();
                break;
            case 'messenger':
                loadMessenger();
                break;
            default:
                loadOverview();
        }
    }

    function loadDashboardData() {
        // Simulate loading data
        cases = [
            { id: 1, title: 'Medical Malpractice Case', client: 'John Doe', status: 'Active', date: '2024-01-15' },
            { id: 2, title: 'Personal Injury Claim', client: 'Jane Smith', status: 'Pending', date: '2024-01-20' }
        ];

        accessRequests = [
            { id: 1, patientName: 'John Doe', purpose: 'Medical malpractice case', status: 'Approved', date: '2024-01-15' },
            { id: 2, patientName: 'Jane Smith', purpose: 'Personal injury claim', status: 'Pending', date: '2024-01-20' }
        ];

        loadPage(currentPage);
    }

    function loadOverview() {
        pageContent.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-600">Active Cases</span>
                        <span class="material-symbols-outlined text-primary">folder</span>
                    </div>
                    <div class="text-2xl font-bold text-gray-900">${cases.length}</div>
                    <div class="text-xs text-gray-600">Total active legal cases</div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-600">Access Requests</span>
                        <span class="material-symbols-outlined text-secondary">request_quote</span>
                    </div>
                    <div class="text-2xl font-bold text-gray-900">${accessRequests.length}</div>
                    <div class="text-xs text-gray-600">Medical records requests</div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-600">Approved</span>
                        <span class="material-symbols-outlined text-success">check_circle</span>
                    </div>
                    <div class="text-2xl font-bold text-gray-900">${accessRequests.filter(r => r.status === 'Approved').length}</div>
                    <div class="text-xs text-gray-600">Approved requests</div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-600">Pending</span>
                        <span class="material-symbols-outlined text-warning">pending</span>
                    </div>
                    <div class="text-2xl font-bold text-gray-900">${accessRequests.filter(r => r.status === 'Pending').length}</div>
                    <div class="text-xs text-gray-600">Pending approval</div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Cases</h3>
                    <div class="space-y-3">
                        ${cases.slice(0, 3).map(case_ => `
                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <div class="font-medium text-gray-900">${case_.title}</div>
                                    <div class="text-sm text-gray-600">${case_.client}</div>
                                </div>
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${case_.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }">${case_.status}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Requests</h3>
                    <div class="space-y-3">
                        ${accessRequests.slice(0, 3).map(request => `
                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <div class="font-medium text-gray-900">${request.patientName}</div>
                                    <div class="text-sm text-gray-600">${request.purpose}</div>
                                </div>
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${request.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }">${request.status}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    function loadCases() {
        pageContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold text-gray-900">Legal Cases</h3>
                    <button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                        <span class="material-symbols-outlined text-sm">add</span>
                        New Case
                    </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="border-b border-gray-200">
                                <th class="pb-3 text-sm font-medium text-gray-900">Case Title</th>
                                <th class="pb-3 text-sm font-medium text-gray-900">Client</th>
                                <th class="pb-3 text-sm font-medium text-gray-900">Status</th>
                                <th class="pb-3 text-sm font-medium text-gray-900">Date</th>
                                <th class="pb-3 text-sm font-medium text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${cases.map(case_ => `
                                <tr class="hover:bg-gray-50">
                                    <td class="py-3 text-sm font-medium text-gray-900">${case_.title}</td>
                                    <td class="py-3 text-sm text-gray-600">${case_.client}</td>
                                    <td class="py-3">
                                        <span class="px-2 py-1 text-xs font-medium rounded-full ${case_.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }">${case_.status}</span>
                                    </td>
                                    <td class="py-3 text-sm text-gray-600">${case_.date}</td>
                                    <td class="py-3 text-sm">
                                        <button class="text-primary hover:text-primary/80">View</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function loadAccessRequests() {
        pageContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold text-gray-900">Access Requests</h3>
                    <button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                        <span class="material-symbols-outlined text-sm">add</span>
                        New Request
                    </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="border-b border-gray-200">
                                <th class="pb-3 text-sm font-medium text-gray-900">Patient Name</th>
                                <th class="pb-3 text-sm font-medium text-gray-900">Purpose</th>
                                <th class="pb-3 text-sm font-medium text-gray-900">Status</th>
                                <th class="pb-3 text-sm font-medium text-gray-900">Date</th>
                                <th class="pb-3 text-sm font-medium text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${accessRequests.map(request => `
                                <tr class="hover:bg-gray-50">
                                    <td class="py-3 text-sm font-medium text-gray-900">${request.patientName}</td>
                                    <td class="py-3 text-sm text-gray-600">${request.purpose}</td>
                                    <td class="py-3">
                                        <span class="px-2 py-1 text-xs font-medium rounded-full ${request.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }">${request.status}</span>
                                    </td>
                                    <td class="py-3 text-sm text-gray-600">${request.date}</td>
                                    <td class="py-3 text-sm">
                                        <button class="text-primary hover:text-primary/80">View</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function loadDocuments() {
        pageContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-6">Documents</h3>
                <div class="text-center py-12">
                    <span class="material-symbols-outlined text-4xl text-gray-400 mb-4">description</span>
                    <p class="text-gray-600">No documents available yet</p>
                    <p class="text-sm text-gray-500">Documents will appear here once access requests are approved</p>
                </div>
            </div>
        `;
    }

    function loadAuditLog() {
        pageContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-6">Audit Log</h3>
                <div class="space-y-3">
                    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span class="material-symbols-outlined text-success">check_circle</span>
                        <div>
                            <div class="font-medium text-gray-900">Access Request Approved</div>
                            <div class="text-sm text-gray-600">John Doe - Medical malpractice case</div>
                            <div class="text-xs text-gray-500">2024-01-15 10:30 AM</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span class="material-symbols-outlined text-warning">pending</span>
                        <div>
                            <div class="font-medium text-gray-900">Access Request Submitted</div>
                            <div class="text-sm text-gray-600">Jane Smith - Personal injury claim</div>
                            <div class="text-xs text-gray-500">2024-01-20 2:45 PM</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function loadMessenger() {
        // Clear interval if exists
        const oldContent = document.getElementById('pageContent');
        if (oldContent && oldContent.dataset.messengerInterval) {
            clearInterval(Number(oldContent.dataset.messengerInterval));
        }

        pageContent.innerHTML = `
            <div class="flex h-[calc(100vh-200px)] gap-4">
                <!-- Sidebar: Conversations -->
                <div class="w-1/3 flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div class="p-4 border-b border-gray-200 bg-gray-50">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-bold text-lg text-gray-900">Chats</h3>
                            <button id="newChatBtn" class="p-2 hover:bg-gray-200 rounded-full transition-colors text-primary">
                                <span class="material-symbols-outlined">add_comment</span>
                            </button>
                        </div>
                        <div class="relative">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">search</span>
                            <input type="text" id="searchConversations" placeholder="Search..." class="w-full bg-white border border-gray-200 rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary">
                        </div>
                    </div>
                    
                    <div id="conversationsList" class="flex-1 overflow-y-auto">
                        <div class="flex items-center justify-center h-20">
                            <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    </div>
                </div>

                <!-- Main: Chat Area -->
                <div class="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm relative">
                    <!-- Chat Header -->
                    <div id="chatHeader" class="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white">
                                <span class="material-symbols-outlined">person</span>
                            </div>
                            <div>
                                <h3 id="currentChatName" class="font-bold text-gray-900">Select a chat</h3>
                                <div id="currentChatStatus" class="flex items-center gap-2 text-xs text-gray-500">
                                    <span class="w-2 h-2 bg-gray-500 rounded-full"></span>
                                    Offline
                                </div>
                            </div>
                        </div>
                        <button class="text-gray-400 hover:text-primary">
                            <span class="material-symbols-outlined">more_vert</span>
                        </button>
                    </div>

                    <!-- Messages Area -->
                    <div id="messagesContainer" class="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                        <div class="flex items-center justify-center h-full text-gray-500 flex-col gap-2">
                            <span class="material-symbols-outlined text-4xl">chat_bubble_outline</span>
                            <p>Select a conversation to start messaging</p>
                        </div>
                    </div>

                    <!-- Input Area -->
                    <div id="messageInputArea" class="p-4 bg-white border-t border-gray-200" style="display: none;">
                        <div id="fileUploadArea" class="hidden mb-2 p-2 bg-gray-100 rounded flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">description</span>
                                <span id="fileName" class="text-xs">filename.pdf</span>
                            </div>
                            <button id="removeFileBtn" class="text-gray-500 hover:text-red-500">
                                <span class="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                        
                        <div class="flex items-end gap-2">
                            <button class="attach-btn p-2 text-gray-400 hover:text-primary transition-colors">
                                <span class="material-symbols-outlined" title="attach_file">attach_file</span>
                            </button>
                            <input type="file" id="fileInput" class="hidden">
                            
                            <textarea id="messageInput" rows="1" placeholder="Type a message..." class="flex-1 bg-gray-100 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-primary resize-none max-h-32"></textarea>
                            
                            <button id="sendBtn" class="p-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                                <span class="material-symbols-outlined">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- New Chat Modal -->
            <div id="newChatModal" class="hidden absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
                <div class="bg-white border border-gray-200 rounded-xl p-6 w-96 max-w-full shadow-2xl">
                    <h3 class="text-xl font-bold text-gray-900 mb-4">New Conversation</h3>
                    
                    <div class="mb-4">
                        <label class="block text-sm text-gray-500 mb-1">Select User</label>
                        <select id="userSelect" class="w-full bg-gray-50 border border-gray-200 rounded p-2 focus:outline-none focus:border-primary">
                            <option value="">Loading users...</option>
                        </select>
                    </div>
                    
                    <div class="flex justify-end gap-3">
                        <button id="cancelNewChat" class="px-4 py-2 text-gray-500 hover:text-primary transition-colors">Cancel</button>
                        <button id="startNewChat" class="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors">Start Chat</button>
                    </div>
                </div>
            </div>
        `;

        // Initialize Messenger Logic
        if (window.Messenger) {
            window.Messenger.init('pageContent');
        } else {
            console.error('Messenger module not loaded');
        }
    }
});
