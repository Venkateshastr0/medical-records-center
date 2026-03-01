// Doctor Dashboard functionality
document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    if (!requireAuth()) return;

    // Initialize
    let currentPage = 'dashboard';
    let patients = [];
    let records = {};

    // Connect to server
    medClient.connect();

    // DOM elements
    const pageContent = document.getElementById('pageContent');
    const doctorName = document.getElementById('doctorName');
    const doctorTitle = document.getElementById('doctorTitle');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const logoutBtn = document.getElementById('logoutBtn');
    const quickUploadBtn = document.getElementById('quickUploadBtn');
    const uploadModal = document.getElementById('uploadModal');
    const uploadForm = document.getElementById('uploadForm');
    const cancelUploadBtn = document.getElementById('cancelUploadBtn');
    const patientSelect = document.getElementById('patientSelect');

    // Set user info
    if (medClient.currentUser) {
        doctorName.textContent = medClient.currentUser.name;
        doctorTitle.textContent = 'Medical Doctor';
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

    quickUploadBtn.addEventListener('click', () => {
        uploadModal.classList.remove('hidden');
        loadPatientOptions();
    });

    cancelUploadBtn.addEventListener('click', () => {
        uploadModal.classList.add('hidden');
        uploadForm.reset();
    });

    uploadForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const data = {
            patientId: parseInt(patientSelect.value),
            type: document.getElementById('recordType').value,
            filePath: document.getElementById('filePath').value
        };

        medClient.addRecord(data, (response) => {
            if (response.success) {
                showNotification('Medical record added successfully!', 'success');
                uploadModal.classList.add('hidden');
                uploadForm.reset();
                loadDashboardData(); // Refresh data
            } else {
                showNotification('Failed to add record: ' + response.message, 'error');
            }
        });
    });

    // Functions
    function setActiveNav(page) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('bg-primary', 'text-white');
            item.classList.add('text-[#49819c]', 'dark:text-[#8ab4c9]');
        });

        const activeItem = document.querySelector(`[data-page="${page}"]`);
        if (activeItem) {
            activeItem.classList.add('bg-primary', 'text-white');
            activeItem.classList.remove('text-[#49819c]', 'dark:text-[#8ab4c9]');
        }

        currentPage = page;
        updatePageHeader(page);
    }

    function updatePageHeader(page) {
        const headers = {
            dashboard: {
                title: 'Dashboard',
                subtitle: 'Welcome back, Dr. Smith. Here is your overview.'
            },
            records: {
                title: 'Medical Records',
                subtitle: 'Manage and view patient medical records.'
            },
            permissions: {
                title: 'Permissions',
                subtitle: 'Manage access permissions for patient records.'
            },
            settings: {
                title: 'Settings',
                subtitle: 'Configure your dashboard preferences.'
            },
            messenger: {
                title: 'Messenger',
                subtitle: 'Secure communication with colleagues and patients.'
            }
        };

        const header = headers[page] || headers.dashboard;
        pageTitle.textContent = header.title;
        pageSubtitle.textContent = header.subtitle;
    }

    function loadPage(page) {
        switch (page) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'records':
                loadRecords();
                break;
            case 'permissions':
                loadPermissions();
                break;
            case 'settings':
                loadSettings();
                break;
            case 'messenger':
                loadMessenger();
                break;
            default:
                loadDashboard();
        }
    }

    function loadDashboardData() {
        // Load patients data
        medClient.getPatients((response) => {
            if (response.success) {
                patients = response.patients;
                loadPage(currentPage);
            }
        });
    }

    function loadDashboard() {
        const totalRecords = patients.length * 2; // Estimate
        const pendingReports = Math.floor(Math.random() * 10) + 1;

        pageContent.innerHTML = `
            <!-- Stats Section -->
            <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-4">
                <div class="flex flex-col gap-2 rounded-xl p-6 border border-[#cee0e8] dark:border-[#2d3a43] bg-white dark:bg-[#16252d] shadow-sm">
                    <div class="flex items-center justify-between">
                        <p class="text-[#49819c] dark:text-[#8ab4c9] text-sm font-bold uppercase tracking-wider">Today's Appointments</p>
                        <span class="material-symbols-outlined text-primary">calendar_today</span>
                    </div>
                    <p class="text-[#0d171c] dark:text-white tracking-tight text-3xl font-black leading-tight">12</p>
                </div>
                <div class="flex flex-col gap-2 rounded-xl p-6 border border-[#cee0e8] dark:border-[#2d3a43] bg-white dark:bg-[#16252d] shadow-sm">
                    <div class="flex items-center justify-between">
                        <p class="text-[#49819c] dark:text-[#8ab4c9] text-sm font-bold uppercase tracking-wider">Pending Reports</p>
                        <span class="material-symbols-outlined text-orange-400">pending_actions</span>
                    </div>
                    <p class="text-[#0d171c] dark:text-white tracking-tight text-3xl font-black leading-tight">${pendingReports}</p>
                </div>
                <div class="flex flex-col gap-2 rounded-xl p-6 border border-[#cee0e8] dark:border-[#2d3a43] bg-white dark:bg-[#16252d] shadow-sm">
                    <div class="flex items-center justify-between">
                        <p class="text-[#49819c] dark:text-[#8ab4c9] text-sm font-bold uppercase tracking-wider">Active Files</p>
                        <span class="material-symbols-outlined text-green-500">description</span>
                    </div>
                    <p class="text-[#0d171c] dark:text-white tracking-tight text-3xl font-black leading-tight">${totalRecords}</p>
                </div>
                <div class="flex flex-col gap-2 rounded-xl p-6 border border-[#cee0e8] dark:border-[#2d3a43] bg-white dark:bg-[#16252d] shadow-sm">
                    <div class="flex items-center justify-between">
                        <p class="text-[#49819c] dark:text-[#8ab4c9] text-sm font-bold uppercase tracking-wider">Storage Used</p>
                        <span class="material-symbols-outlined text-purple-500">database</span>
                    </div>
                    <p class="text-[#0d171c] dark:text-white tracking-tight text-3xl font-black leading-tight">82%</p>
                </div>
            </section>

            <!-- Patient Records Table -->
            <section class="py-6 flex-1">
                <div class="bg-white dark:bg-[#16252d] rounded-xl border border-[#cee0e8] dark:border-[#2d3a43] overflow-hidden shadow-sm flex flex-col">
                    <div class="p-6 border-b border-[#cee0e8] dark:border-[#2d3a43] flex items-center justify-between">
                        <h2 class="text-[#0d171c] dark:text-white text-xl font-bold leading-tight">Patient Records</h2>
                        <div class="relative w-72">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#49819c] text-[20px]">search</span>
                            <input id="patientSearch" class="w-full pl-10 pr-4 py-2 bg-background-light dark:bg-background-dark border-none rounded-lg text-sm focus:ring-2 focus:ring-primary" placeholder="Search patients..." type="text"/>
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-background-light dark:bg-background-dark/50">
                                    <th class="px-6 py-4 text-[#0d171c] dark:text-white text-xs font-bold uppercase tracking-wider">Patient Name</th>
                                    <th class="px-6 py-4 text-[#0d171c] dark:text-white text-xs font-bold uppercase tracking-wider">Age</th>
                                    <th class="px-6 py-4 text-[#0d171c] dark:text-white text-xs font-bold uppercase tracking-wider">Status</th>
                                    <th class="px-6 py-4 text-[#0d171c] dark:text-white text-xs font-bold uppercase tracking-wider">Records</th>
                                    <th class="px-6 py-4 text-right text-[#0d171c] dark:text-white text-xs font-bold uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-[#cee0e8] dark:divide-[#2d3a43]">
                                ${patients.map(patient => `
                                    <tr class="hover:bg-primary/5 transition-colors">
                                        <td class="px-6 py-5">
                                            <div class="flex items-center gap-3">
                                                <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                                    ${patient.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <span class="text-[#0d171c] dark:text-white font-semibold">${patient.name}</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-5 text-[#49819c] dark:text-[#8ab4c9] text-sm">${patient.age}</td>
                                        <td class="px-6 py-5">
                                            <span class="px-2 py-1 ${getStatusColor(patient.status)} text-xs rounded-full">${patient.status}</span>
                                        </td>
                                        <td class="px-6 py-5 text-[#49819c] dark:text-[#8ab4c9] text-sm">
                                            <button onclick="viewPatientRecords(${patient.patient_id})" class="text-primary hover:underline">
                                                View Records
                                            </button>
                                        </td>
                                        <td class="px-6 py-5 text-right">
                                            <button onclick="quickAddRecord(${patient.patient_id})" class="text-primary hover:underline mr-3">
                                                Add Record
                                            </button>
                                            <button onclick="viewPatientDetails(${patient.patient_id})" class="text-primary hover:underline">
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        `;

        // Add search functionality
        const searchInput = document.getElementById('patientSearch');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(function (e) {
                const query = e.target.value.toLowerCase();
                filterPatients(query);
            }, 300));
        }
    }

    function loadRecords() {
        showLoading(pageContent, 'Loading medical records...');

        let html = `
            <div class="flex flex-col gap-6">
                <div class="bg-white dark:bg-[#16252d] rounded-xl border border-[#cee0e8] dark:border-[#2d3a43] p-6">
                    <h3 class="text-lg font-bold mb-4">All Medical Records</h3>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        `;

        patients.forEach(patient => {
            medClient.getRecords(patient.patient_id, (response) => {
                if (response.success) {
                    response.records.forEach(record => {
                        html += `
                            <div class="border border-[#cee0e8] dark:border-[#2d3a43] rounded-lg p-4">
                                <div class="flex items-center justify-between mb-2">
                                    <h4 class="font-semibold">${patient.name}</h4>
                                    <span class="text-xs text-[#49819c]">${formatDate(record.created_at)}</span>
                                </div>
                                <p class="text-sm text-[#49819c] mb-2">Type: ${record.type}</p>
                                <button onclick="viewRecord(${record.record_id})" class="text-primary text-sm hover:underline">
                                    View Record
                                </button>
                            </div>
                        `;
                    });
                }
            });
        });

        html += `
                    </div>
                </div>
            </div>
        `;

        pageContent.innerHTML = html;
    }

    function loadPermissions() {
        pageContent.innerHTML = `
            <div class="flex flex-col gap-6">
                <div class="bg-white dark:bg-[#16252d] rounded-xl border border-[#cee0e8] dark:border-[#2d3a43] p-6">
                    <h3 class="text-lg font-bold mb-4">Access Permissions</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                                <p class="font-medium">Insurance Access</p>
                                <p class="text-sm text-[#49819c]">Allow insurance companies to view patient records</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                        
                        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                                <p class="font-medium">Legal Access</p>
                                <p class="text-sm text-[#49819c]">Allow legal representatives to view patient records</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function loadSettings() {
        pageContent.innerHTML = `
            <div class="flex flex-col gap-6">
                <div class="bg-white dark:bg-[#16252d] rounded-xl border border-[#cee0e8] dark:border-[#2d3a43] p-6">
                    <h3 class="text-lg font-bold mb-4">Dashboard Settings</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Default View</label>
                            <select class="w-full p-2 border rounded-lg">
                                <option>Dashboard</option>
                                <option>Patient Records</option>
                                <option>Recent Activity</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Notifications</label>
                            <label class="flex items-center gap-2">
                                <input type="checkbox" class="rounded" checked>
                                <span class="text-sm">Email notifications for new records</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function loadPatientOptions() {
        patientSelect.innerHTML = '<option value="">Choose a patient...</option>';
        patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.patient_id;
            option.textContent = `${patient.name} (Age: ${patient.age})`;
            patientSelect.appendChild(option);
        });
    }

    function filterPatients(query) {
        const rows = document.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const name = row.querySelector('td:first-child span').textContent.toLowerCase();
            if (name.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
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
                <div class="w-1/3 flex flex-col bg-white dark:bg-[#16252d] border border-[#cee0e8] dark:border-[#2d3a43] rounded-xl overflow-hidden shadow-sm">
                    <div class="p-4 border-b border-[#cee0e8] dark:border-[#2d3a43] bg-background-light dark:bg-[#16252d]">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-bold text-lg text-[#0d171c] dark:text-white">Chats</h3>
                            <button id="newChatBtn" class="p-2 hover:bg-primary/10 rounded-full transition-colors text-primary">
                                <span class="material-symbols-outlined">add_comment</span>
                            </button>
                        </div>
                        <div class="relative">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#49819c] text-sm">search</span>
                            <input type="text" id="searchConversations" placeholder="Search..." class="w-full bg-white dark:bg-[#1f333e] border border-[#cee0e8] dark:border-[#2d3a43] rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary">
                        </div>
                    </div>
                    
                    <div id="conversationsList" class="flex-1 overflow-y-auto">
                        <!-- Conversations will be loaded here -->
                        <div class="flex items-center justify-center h-20">
                            <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    </div>
                </div>

                <!-- Main: Chat Area -->
                <div class="flex-1 flex flex-col bg-white dark:bg-[#16252d] border border-[#cee0e8] dark:border-[#2d3a43] rounded-xl overflow-hidden shadow-sm relative">
                    <!-- Chat Header -->
                    <div id="chatHeader" class="p-4 border-b border-[#cee0e8] dark:border-[#2d3a43] bg-background-light dark:bg-[#16252d] flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white">
                                <span class="material-symbols-outlined">person</span>
                            </div>
                            <div>
                                <h3 id="currentChatName" class="font-bold text-[#0d171c] dark:text-white">Select a chat</h3>
                                <div id="currentChatStatus" class="flex items-center gap-2 text-xs text-[#49819c]">
                                    <span class="w-2 h-2 bg-gray-400 rounded-full"></span>
                                    Offline
                                </div>
                            </div>
                        </div>
                        <button class="text-[#49819c] hover:text-primary">
                            <span class="material-symbols-outlined">more_vert</span>
                        </button>
                    </div>

                    <!-- Messages Area -->
                    <div id="messagesContainer" class="flex-1 p-4 overflow-y-auto space-y-4 bg-background-light/50 dark:bg-[#1f333e]/50">
                        <!-- Messages will appear here -->
                        <div class="flex items-center justify-center h-full text-[#49819c] flex-col gap-2">
                            <span class="material-symbols-outlined text-4xl">chat_bubble_outline</span>
                            <p>Select a conversation to start messaging</p>
                        </div>
                    </div>

                    <!-- Input Area -->
                    <div id="messageInputArea" class="p-4 bg-white dark:bg-[#16252d] border-t border-[#cee0e8] dark:border-[#2d3a43]" style="display: none;">
                        <div id="fileUploadArea" class="hidden mb-2 p-2 bg-background-light dark:bg-[#1f333e] rounded flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">description</span>
                                <span id="fileName" class="text-xs text-[#0d171c] dark:text-white">filename.pdf</span>
                            </div>
                            <button id="removeFileBtn" class="text-gray-500 hover:text-red-500">
                                <span class="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                        
                        <div class="flex items-end gap-2">
                            <button class="attach-btn p-2 text-[#49819c] hover:text-primary transition-colors">
                                <span class="material-symbols-outlined" title="attach_file">attach_file</span>
                            </button>
                            <input type="file" id="fileInput" class="hidden">
                            
                            <textarea id="messageInput" rows="1" placeholder="Type a message..." class="flex-1 bg-background-light dark:bg-[#1f333e] border-none rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none max-h-32"></textarea>
                            
                            <button id="sendBtn" class="p-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                                <span class="material-symbols-outlined">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- New Chat Modal -->
            <div id="newChatModal" class="hidden absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
                <div class="bg-white dark:bg-[#16252d] border border-[#cee0e8] dark:border-[#2d3a43] rounded-xl p-6 w-96 max-w-full shadow-2xl">
                    <h3 class="text-xl font-bold text-[#0d171c] dark:text-white mb-4">New Conversation</h3>
                    
                    <div class="mb-4">
                        <label class="block text-sm text-[#49819c] mb-1">Select User</label>
                        <select id="userSelect" class="w-full bg-background-light dark:bg-[#1f333e] border border-[#cee0e8] dark:border-[#2d3a43] rounded p-2 focus:outline-none focus:border-primary">
                            <option value="">Loading users...</option>
                        </select>
                    </div>
                    
                    <div class="flex justify-end gap-3">
                        <button id="cancelNewChat" class="px-4 py-2 text-[#49819c] hover:text-primary transition-colors">Cancel</button>
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

// Global functions
window.viewPatientRecords = function (patientId) {
    window.medClient.getRecords(patientId, (response) => {
        if (response.success) {
            window.showNotification(`Loaded ${response.records.length} records for patient`, 'success');
        } else {
            window.showNotification('Failed to load patient records', 'error');
        }
    });
};

window.quickAddRecord = function (patientId) {
    document.getElementById('uploadModal').classList.remove('hidden');
    document.getElementById('patientSelect').value = patientId;
};

window.viewPatientDetails = function (patientId) {
    window.showNotification('Patient details view would be implemented here', 'info');
};

window.viewRecord = function (recordId) {
    window.medClient.viewRecord(recordId, (response) => {
        if (response.success) {
            window.showNotification(`Record file path: ${response.record.filePath}`, 'info');
        } else {
            window.showNotification('Failed to view record', 'error');
        }
    });
};
