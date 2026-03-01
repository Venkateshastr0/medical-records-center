// Enhanced Admin Dashboard with User Approval Workflow
document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    if (!requireAuth()) return;

    // Initialize
    let currentPage = 'overview';
    let pendingRegistrations = [];
    let allUsers = [];
    let organizations = [];

    // Connect to server
    medClient.connect();

    // DOM elements
    const pageContent = document.getElementById('pageContent');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const logoutBtn = document.getElementById('logoutBtn');

    // Load initial data
    loadDashboardData();

    // Navigation
    document.querySelectorAll('.nav-link, .nav-item').forEach(item => {
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
        document.querySelectorAll('.nav-link, .nav-item').forEach(item => {
            item.classList.remove('border-b-2', 'border-primary', 'text-[#0d171c]', 'dark:text-white', 'bg-primary/10', 'text-primary');
            item.classList.add('text-[#0d171c]/70', 'dark:text-white/70', 'text-slate-600', 'dark:text-slate-300');
        });

        const activeItems = document.querySelectorAll(`[data-page="${page}"]`);
        activeItems.forEach(item => {
            if (item.classList.contains('nav-link')) {
                item.classList.add('border-b-2', 'border-primary', 'text-[#0d171c]', 'dark:text-white');
                item.classList.remove('text-[#0d171c]/70', 'dark:text-white/70');
            } else {
                item.classList.add('bg-primary/10', 'text-primary');
                item.classList.remove('text-slate-600', 'dark:text-slate-300');
            }
        });

        currentPage = page;
        updatePageHeader(page);
    }

    function updatePageHeader(page) {
        const headers = {
            overview: {
                title: 'Admin Dashboard',
                subtitle: 'Manage users, organizations, and system settings.'
            },
            users: {
                title: 'User Management',
                subtitle: 'Approve user registrations and manage accounts.'
            },
            organizations: {
                title: 'Organizations',
                subtitle: 'Approve hospitals, law firms, and insurance companies.'
            },
            system: {
                title: 'System Settings',
                subtitle: 'Configure system preferences and security settings.'
            },
            audit: {
                title: 'Audit Log',
                subtitle: 'View system activity and access logs.'
            },
            messenger: {
                title: 'Secure Messenger',
                subtitle: 'Encrypted communication with staff and patients.'
            }
        };

        const header = headers[page] || headers.overview;
        pageTitle.textContent = header.title;
        pageSubtitle.textContent = header.subtitle;
    }

    function loadPage(page) {
        switch (page) {
            case 'overview':
                loadOverview();
                break;
            case 'users':
                loadUserManagement();
                break;
            case 'organizations':
                loadOrganizationManagement();
                break;
            case 'system':
                loadSystemSettings();
                break;
            case 'audit':
                loadAuditLog();
                break;
            case 'messenger':
                loadMessenger();
                break;
            default:
                loadOverview();
        }
    }

    function loadDashboardData() {
        // Load all admin data
        medClient.getSystemStats((response) => {
            if (response.success) {
                loadPage(currentPage);
            }
        });
    }

    function loadOverview() {
        showLoading(pageContent, 'Loading dashboard...');

        medClient.getSystemStats((response) => {
            if (response.success) {
                const stats = response.stats;
                pageContent.innerHTML = `
                    <!-- System Statistics -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div class="bg-white dark:bg-slate-900 rounded-xl p-6 border border-[#cee0e8] dark:border-slate-800 shadow-sm">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-medium text-gray-500">Total Users</span>
                                <span class="material-symbols-outlined text-blue-500">people</span>
                            </div>
                            <p class="text-2xl font-bold">${stats.users.total_users}</p>
                            <p class="text-sm text-green-600">${stats.users.approved_users} approved</p>
                        </div>
                        <div class="bg-white dark:bg-slate-900 rounded-xl p-6 border border-[#cee0e8] dark:border-slate-800 shadow-sm">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-medium text-gray-500">Pending Registrations</span>
                                <span class="material-symbols-outlined text-yellow-500">pending</span>
                            </div>
                            <p class="text-2xl font-bold">${stats.registrations.pending_registrations}</p>
                            <p class="text-sm text-gray-500">Awaiting approval</p>
                        </div>
                        <div class="bg-white dark:bg-slate-900 rounded-xl p-6 border border-[#cee0e8] dark:border-slate-800 shadow-sm">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-medium text-gray-500">Organizations</span>
                                <span class="material-symbols-outlined text-purple-500">business</span>
                            </div>
                            <p class="text-2xl font-bold">${stats.organizations.total_organizations}</p>
                            <p class="text-sm text-green-600">${stats.organizations.approved_organizations} approved</p>
                        </div>
                        <div class="bg-white dark:bg-slate-900 rounded-xl p-6 border border-[#cee0e8] dark:border-slate-800 shadow-sm">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-medium text-gray-500">System Status</span>
                                <span class="material-symbols-outlined text-green-500">check_circle</span>
                            </div>
                            <p class="text-2xl font-bold">Online</p>
                            <p class="text-sm text-green-600">All systems operational</p>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="bg-white dark:bg-slate-900 rounded-xl p-6 border border-[#cee0e8] dark:border-slate-800 shadow-sm">
                            <h3 class="text-lg font-bold mb-4">Quick Actions</h3>
                            <div class="space-y-3">
                                <button onclick="loadPage('users')" class="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div class="flex items-center gap-3">
                                        <span class="material-symbols-outlined text-primary">person_add</span>
                                        <span class="font-medium">Review User Registrations</span>
                                    </div>
                                </button>
                                <button onclick="loadPage('organizations')" class="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div class="flex items-center gap-3">
                                        <span class="material-symbols-outlined text-primary">business</span>
                                        <span class="font-medium">Manage Organizations</span>
                                    </div>
                                </button>
                                <button onclick="loadPage('system')" class="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div class="flex items-center gap-3">
                                        <span class="material-symbols-outlined text-primary">settings</span>
                                        <span class="font-medium">System Settings</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div class="bg-white dark:bg-slate-900 rounded-xl p-6 border border-[#cee0e8] dark:border-slate-800 shadow-sm">
                            <h3 class="text-lg font-bold mb-4">Recent Activity</h3>
                            <div class="space-y-3">
                                <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <span class="material-symbols-outlined text-blue-500">person_add</span>
                                    <div class="flex-1">
                                        <p class="font-medium text-sm">New user registration</p>
                                        <p class="text-xs text-gray-500">2 hours ago</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <span class="material-symbols-outlined text-green-500">check_circle</span>
                                    <div class="flex-1">
                                        <p class="font-medium text-sm">Organization approved</p>
                                        <p class="text-xs text-gray-500">5 hours ago</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <span class="material-symbols-outlined text-purple-500">security</span>
                                    <div class="flex-1">
                                        <p class="font-medium text-sm">Security scan completed</p>
                                        <p class="text-xs text-gray-500">1 day ago</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
    }

    function loadUserManagement() {
        showLoading(pageContent, 'Loading user registrations...');

        medClient.getPendingRegistrations((response) => {
            if (response.success) {
                pendingRegistrations = response.registrations;
                renderUserManagement();
            }
        });
    }

    function renderUserManagement() {
        pageContent.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-[#cee0e8] dark:border-slate-800 shadow-sm">
                <div class="p-6 border-b border-[#cee0e8] dark:border-slate-800">
                    <h3 class="text-lg font-bold">Pending User Registrations</h3>
                    <p class="text-sm text-gray-500 mt-1">Review and approve new user requests</p>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">Name</th>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">Username</th>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">Email</th>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">Role</th>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">Organization</th>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">Submitted</th>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                            ${pendingRegistrations.map(reg => `
                                <tr>
                                    <td class="px-6 py-4 text-sm font-medium">${reg.name}</td>
                                    <td class="px-6 py-4 text-sm">${reg.username}</td>
                                    <td class="px-6 py-4 text-sm">${reg.email}</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs rounded-full ${getRoleColor(reg.role)}">
                                            ${reg.role}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-sm">${reg.organization || 'N/A'}</td>
                                    <td class="px-6 py-4 text-sm">${formatDate(reg.submitted_at)}</td>
                                    <td class="px-6 py-4 text-sm">
                                        <div class="flex gap-2">
                                            <button onclick="viewRegistration(${reg.registration_id})" class="text-primary hover:underline">
                                                View
                                            </button>
                                            <button onclick="approveRegistration(${reg.registration_id})" class="text-green-600 hover:underline">
                                                Approve
                                            </button>
                                            <button onclick="rejectRegistration(${reg.registration_id})" class="text-red-600 hover:underline">
                                                Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${pendingRegistrations.length === 0 ? `
                        <div class="text-center py-8">
                            <p class="text-gray-500">No pending registrations</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function loadOrganizationManagement() {
        showLoading(pageContent, 'Loading organizations...');

        medClient.getAllOrganizations((response) => {
            if (response.success) {
                organizations = response.organizations;
                renderOrganizationManagement();
            }
        });
    }

    function renderOrganizationManagement() {
        pageContent.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-[#cee0e8] dark:border-slate-800 shadow-sm">
                <div class="p-6 border-b border-[#cee0e8] dark:border-slate-800">
                    <h3 class="text-lg font-bold">Organizations</h3>
                    <p class="text-sm text-gray-500 mt-1">Manage hospitals, law firms, and insurance companies</p>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">Name</th>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">Type</th>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">License</th>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">Contact</th>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                            ${organizations.map(org => `
                                <tr>
                                    <td class="px-6 py-4 text-sm font-medium">${org.name}</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs rounded-full ${getOrgTypeColor(org.type)}">
                                            ${org.type}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-sm">${org.license_number || 'N/A'}</td>
                                    <td class="px-6 py-4 text-sm">${org.email}</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs rounded-full ${org.status === 'approved' ? 'bg-green-100 text-green-800' :
                org.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
            }">${org.status}</span>
                                    </td>
                                    <td class="px-6 py-4 text-sm">
                                        ${org.status === 'pending' ?
                `<button onclick="approveOrganization(${org.org_id})" class="text-green-600 hover:underline">
                                                Approve
                                            </button>` :
                '<span class="text-gray-400">Approved</span>'
            }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function loadSystemSettings() {
        pageContent.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-[#cee0e8] dark:border-slate-800 shadow-sm p-6">
                <h3 class="text-lg font-bold mb-6">System Settings</h3>
                <div class="space-y-6">
                    <div>
                        <h4 class="font-medium mb-3">Security Settings</h4>
                        <div class="space-y-3">
                            <label class="flex items-center gap-3">
                                <input type="checkbox" class="rounded" checked>
                                <span class="text-sm">Enable two-factor authentication</span>
                            </label>
                            <label class="flex items-center gap-3">
                                <input type="checkbox" class="rounded" checked>
                                <span class="text-sm">Require email verification</span>
                            </label>
                            <label class="flex items-center gap-3">
                                <input type="checkbox" class="rounded">
                                <span class="text-sm">Session timeout after inactivity</span>
                            </label>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-medium mb-3">Data Protection</h4>
                        <div class="space-y-3">
                            <label class="flex items-center gap-3">
                                <input type="checkbox" class="rounded" checked>
                                <span class="text-sm">End-to-end encryption</span>
                            </label>
                            <label class="flex items-center gap-3">
                                <input type="checkbox" class="rounded" checked>
                                <span class="text-sm">Automatic data backup</span>
                            </label>
                            <label class="flex items-center gap-3">
                                <input type="checkbox" class="rounded" checked>
                                <span class="text-sm">Audit logging enabled</span>
                            </label>
                        </div>
                    </div>

                    <div class="pt-4">
                        <button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function loadAuditLog() {
        pageContent.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-[#cee0e8] dark:border-slate-800 shadow-sm p-6">
                <h3 class="text-lg font-bold mb-4">System Audit Log</h3>
                <div class="space-y-3">
                    <div class="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span class="material-symbols-outlined text-blue-500">login</span>
                        <div class="flex-1">
                            <p class="font-medium">Admin logged in</p>
                            <p class="text-sm text-gray-500">${new Date().toLocaleString()}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span class="material-symbols-outlined text-green-500">check_circle</span>
                        <div class="flex-1">
                            <p class="font-medium">User registration approved</p>
                            <p class="text-sm text-gray-500">2 hours ago</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span class="material-symbols-outlined text-purple-500">security</span>
                        <div class="flex-1">
                            <p class="font-medium">Security scan completed</p>
                            <p class="text-sm text-gray-500">1 day ago</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Helper functions
    function getRoleColor(role) {
        const colors = {
            'Admin': 'bg-purple-100 text-purple-800',
            'Doctor': 'bg-blue-100 text-blue-800',
            'Insurance': 'bg-green-100 text-green-800',
            'Lawyer': 'bg-yellow-100 text-yellow-800'
        };
        return colors[role] || 'bg-gray-100 text-gray-800';
    }

    function getOrgTypeColor(type) {
        const colors = {
            'Hospital': 'bg-blue-100 text-blue-800',
            'Law Firm': 'bg-yellow-100 text-yellow-800',
            'Insurance': 'bg-green-100 text-green-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    }
});

// Global functions
window.viewRegistration = function (registrationId) {
    const registration = pendingRegistrations.find(r => r.registration_id === registrationId);
    if (registration) {
        alert(`Registration Details:\n\nName: ${registration.name}\nEmail: ${registration.email}\nRole: ${registration.role}\nOrganization: ${registration.organization}\nPurpose: ${registration.registration_purpose}`);
    }
};

window.approveRegistration = function (registrationId) {
    if (confirm('Are you sure you want to approve this registration?')) {
        medClient.approveRegistration(registrationId, (response) => {
            if (response.success) {
                window.showNotification('Registration approved successfully!', 'success');
                loadUserManagement();
            } else {
                window.showNotification('Failed to approve registration', 'error');
            }
        });
    }
};

window.rejectRegistration = function (registrationId) {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
        medClient.rejectRegistration(registrationId, reason, (response) => {
            if (response.success) {
                window.showNotification('Registration rejected successfully!', 'success');
                loadUserManagement();
            } else {
                window.showNotification('Failed to reject registration', 'error');
            }
        });
    }
};

window.approveOrganization = function (orgId) {
    if (confirm('Are you sure you want to approve this organization?')) {
        medClient.approveOrganization(orgId, (response) => {
            if (response.success) {
                window.showNotification('Organization approved successfully!', 'success');
                loadOrganizationManagement();
            } else {
                window.showNotification('Failed to approve organization', 'error');
            }
        });
    }
};

window.loadPage = function (page) {
    const dashboard = document.querySelector('.admin-dashboard');
    if (dashboard && dashboard.adminDashboard) {
        dashboard.adminDashboard.loadPage(page);
    }
};

// Messenger function for admin dashboard
function loadMessenger() {
    // Clear interval if exists
    const oldContent = document.getElementById('pageContent');
    if (oldContent && oldContent.dataset.messengerInterval) {
        clearInterval(Number(oldContent.dataset.messengerInterval));
    }

    pageContent.innerHTML = `
        <div class="flex h-[calc(100vh-200px)] gap-4">
            <!-- Sidebar: Conversations -->
            <div class="w-1/3 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="font-bold text-lg text-gray-900 dark:text-white">Chats</h3>
                        <button id="newChatBtn" class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-primary">
                            <span class="material-symbols-outlined">add_comment</span>
                        </button>
                    </div>
                    <div class="relative">
                        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">search</span>
                        <input type="text" id="searchConversations" placeholder="Search..." class="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary">
                    </div>
                </div>
                
                <div id="conversationsList" class="flex-1 overflow-y-auto">
                    <div class="flex items-center justify-center h-20">
                        <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>

            <!-- Main: Chat Area -->
            <div class="flex-1 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm relative">
                <!-- Chat Header -->
                <div id="chatHeader" class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white">
                            <span class="material-symbols-outlined">person</span>
                        </div>
                        <div>
                            <h3 id="currentChatName" class="font-bold text-gray-900 dark:text-white">Select a chat</h3>
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
                <div id="messagesContainer" class="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 dark:bg-gray-800">
                    <div class="flex items-center justify-center h-full text-gray-500 flex-col gap-2">
                        <span class="material-symbols-outlined text-4xl">chat_bubble_outline</span>
                        <p>Select a conversation to start messaging</p>
                    </div>
                </div>

                <!-- Input Area -->
                <div id="messageInputArea" class="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700" style="display: none;">
                    <div id="fileUploadArea" class="hidden mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary">description</span>
                            <span id="fileName" class="text-xs text-gray-900 dark:text-white">filename.pdf</span>
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
                        
                        <textarea id="messageInput" rows="1" placeholder="Type a message..." class="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:border-primary resize-none max-h-32"></textarea>
                        
                        <button id="sendBtn" class="p-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                            <span class="material-symbols-outlined">send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- New Chat Modal -->
        <div id="newChatModal" class="hidden absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-96 max-w-full shadow-2xl">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">New Conversation</h3>
                
                <div class="mb-4">
                    <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1">Select User</label>
                    <select id="userSelect" class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded p-2 focus:outline-none focus:border-primary">
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
