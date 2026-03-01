// Insurance Dashboard functionality
document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    if (!requireAuth()) return;

    // Initialize
    let currentPage = 'overview';
    let patients = [];
    let accessRequests = [];
    let approvedRecords = [];

    // Connect to server
    medClient.connect();

    // DOM elements
    const pageContent = document.getElementById('pageContent');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const logoutBtn = document.getElementById('logoutBtn');
    const requestAccessBtn = document.getElementById('requestAccessBtn');
    const requestModal = document.getElementById('requestModal');
    const requestForm = document.getElementById('requestForm');
    const cancelRequestBtn = document.getElementById('cancelRequestBtn');
    const globalSearch = document.getElementById('globalSearch');

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

    requestAccessBtn.addEventListener('click', () => {
        requestModal.classList.remove('hidden');
    });

    cancelRequestBtn.addEventListener('click', () => {
        requestModal.classList.add('hidden');
        requestForm.reset();
    });

    requestForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const requestData = {
            patientName: document.getElementById('patientName').value,
            claimId: document.getElementById('claimId').value,
            reason: document.getElementById('accessReason').value,
            notes: document.getElementById('notes').value
        };

        // Simulate request submission
        showNotification('Access request submitted successfully!', 'success');
        requestModal.classList.add('hidden');
        requestForm.reset();

        // Add to requests list
        accessRequests.push({
            id: accessRequests.length + 1,
            ...requestData,
            status: 'pending',
            submittedAt: new Date().toISOString()
        });

        loadPage(currentPage);
    });

    globalSearch.addEventListener('input', debounce(function (e) {
        const query = e.target.value.toLowerCase();
        filterContent(query);
    }, 300));

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
                title: 'Insurance Dashboard',
                subtitle: 'Manage healthcare access requests and review processed medical claims.'
            },
            requests: {
                title: 'Access Requests',
                subtitle: 'Track and manage your medical record access requests.'
            },
            approved: {
                title: 'Approved Records',
                subtitle: 'View and download approved medical records.'
            },
            claims: {
                title: 'Claim Reviews',
                subtitle: 'Review medical claims and associated documentation.'
            },
            documents: {
                title: 'Documents',
                subtitle: 'Manage your document library and templates.'
            },
            audit: {
                title: 'Audit Log',
                subtitle: 'View your activity history and access logs.'
            },
            settings: {
                title: 'Settings',
                subtitle: 'Configure your insurance agent preferences.'
            },
            messenger: {
                title: 'Secure Messenger',
                subtitle: 'Encrypted communication channel.'
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
            case 'requests':
                loadRequests();
                break;
            case 'approved':
                loadApprovedRecords();
                break;
            case 'claims':
                loadClaims();
                break;
            case 'documents':
                loadDocuments();
                break;
            case 'audit':
                loadAudit();
                break;
            case 'settings':
                loadSettings();
                break;
            case 'messenger':
                loadMessenger();
                break;
            default:
                loadOverview();
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

    function loadOverview() {
        const pendingRequests = accessRequests.filter(r => r.status === 'pending').length;
        const approvedCount = approvedRecords.length;
        const totalClaims = patients.length * 3; // Estimate

        pageContent.innerHTML = `
            <!-- Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-[#cee0e8] dark:border-slate-800 shadow-sm">
                    <div class="flex justify-between items-start">
                        <p class="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Pending Requests</p>
                        <span class="material-symbols-outlined text-primary">schedule</span>
                    </div>
                    <div class="flex items-baseline gap-2 mt-2">
                        <p class="text-[#0d171c] dark:text-white tracking-tight text-3xl font-bold">${pendingRequests}</p>
                        <p class="text-[#078836] text-sm font-bold bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">+12%</p>
                    </div>
                </div>
                <div class="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-[#cee0e8] dark:border-slate-800 shadow-sm">
                    <div class="flex justify-between items-start">
                        <p class="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Approved Records</p>
                        <span class="material-symbols-outlined text-green-500">verified_user</span>
                    </div>
                    <div class="flex items-baseline gap-2 mt-2">
                        <p class="text-[#0d171c] dark:text-white tracking-tight text-3xl font-bold">${approvedCount}</p>
                        <p class="text-[#e73508] text-sm font-bold bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">-5%</p>
                    </div>
                </div>
                <div class="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-[#cee0e8] dark:border-slate-800 shadow-sm">
                    <div class="flex justify-between items-start">
                        <p class="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Total Claims</p>
                        <span class="material-symbols-outlined text-purple-500">analytics</span>
                    </div>
                    <div class="flex items-baseline gap-2 mt-2">
                        <p class="text-[#0d171c] dark:text-white tracking-tight text-3xl font-bold">${totalClaims}</p>
                        <p class="text-[#078836] text-sm font-bold bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">+8%</p>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-[#cee0e8] dark:border-slate-800 shadow-sm p-6 mb-8">
                <h3 class="text-lg font-bold mb-4">Recent Activity</h3>
                <div class="space-y-4">
                    <div class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span class="material-symbols-outlined text-blue-600">description</span>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium">New medical record accessed</p>
                            <p class="text-sm text-gray-500">John Doe - X-Ray report</p>
                        </div>
                        <span class="text-sm text-gray-500">2 hours ago</span>
                    </div>
                    <div class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span class="material-symbols-outlined text-green-600">check_circle</span>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium">Access request approved</p>
                            <p class="text-sm text-gray-500">Claim #CLM-2024-0152</p>
                        </div>
                        <span class="text-sm text-gray-500">5 hours ago</span>
                    </div>
                    <div class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span class="material-symbols-outlined text-yellow-600">pending</span>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium">New access request submitted</p>
                            <p class="text-sm text-gray-500">Jane Smith - MRI report</p>
                        </div>
                        <span class="text-sm text-gray-500">1 day ago</span>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-slate-900 rounded-xl border border-[#cee0e8] dark:border-slate-800 shadow-sm p-6">
                    <h3 class="text-lg font-bold mb-4">Quick Actions</h3>
                    <div class="space-y-3">
                        <button onclick="showRequestModal()" class="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-primary">add</span>
                                <span class="font-medium">New Access Request</span>
                            </div>
                        </button>
                        <button onclick="loadPage('claims')" class="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-primary">fact_check</span>
                                <span class="font-medium">Review Claims</span>
                            </div>
                        </button>
                        <button onclick="loadPage('documents')" class="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-primary">folder</span>
                                <span class="font-medium">Browse Documents</span>
                            </div>
                        </button>
                    </div>
                </div>

                <div class="bg-white dark:bg-slate-900 rounded-xl border border-[#cee0e8] dark:border-slate-800 shadow-sm p-6">
                    <h3 class="text-lg font-bold mb-4">System Status</h3>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-sm">API Connection</span>
                            <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Connected</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm">Database Sync</span>
                            <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Synced</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm">Security Status</span>
                            <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Secure</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function loadRequests() {
        pageContent.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-[#cee0e8] dark:border-slate-800 shadow-sm">
                <div class="p-6 border-b border-[#cee0e8] dark:border-slate-800">
                    <h3 class="text-lg font-bold">My Access Requests</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">Request ID</th>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">Patient Name</th>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">Claim ID</th>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">Reason</th>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">Submitted</th>
                                <th class="px-6 py-3 text-xs font-medium uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                            ${accessRequests.map(request => `
                                <tr>
                                    <td class="px-6 py-4 text-sm">#REQ-${String(request.id).padStart(4, '0')}</td>
                                    <td class="px-6 py-4 text-sm font-medium">${request.patientName}</td>
                                    <td class="px-6 py-4 text-sm">${request.claimId}</td>
                                    <td class="px-6 py-4 text-sm">${request.reason.replace('_', ' ')}</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs rounded-full ${request.status === 'approved' ? 'bg-green-100 text-green-800' :
                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
            }">${request.status}</span>
                                    </td>
                                    <td class="px-6 py-4 text-sm">${formatDate(request.submittedAt)}</td>
                                    <td class="px-6 py-4 text-sm">
                                        ${request.status === 'approved' ?
                '<button class="text-primary hover:underline">Download</button>' :
                '<button class="text-gray-400" disabled>Processing</button>'
            }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${accessRequests.length === 0 ? `
                        <div class="text-center py-8">
                            <p class="text-gray-500">No access requests found</p>
                            <button onclick="showRequestModal()" class="mt-4 px-4 py-2 bg-primary text-white rounded-lg">
                                Submit First Request
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function loadApprovedRecords() {
        showLoading(pageContent, 'Loading approved records...');

        let html = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        `;

        patients.forEach(patient => {
            medClient.getRecords(patient.patient_id, (response) => {
                if (response.success) {
                    response.records.forEach(record => {
                        html += `
                            <div class="bg-white dark:bg-slate-900 rounded-xl border border-[#cee0e8] dark:border-slate-800 shadow-sm p-6">
                                <div class="flex items-start justify-between mb-4">
                                    <div>
                                        <h4 class="font-bold text-lg">${patient.name}</h4>
                                        <p class="text-sm text-gray-500">Age: ${patient.age}</p>
                                    </div>
                                    <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Approved</span>
                                </div>
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <span class="text-sm text-gray-500">Record Type:</span>
                                        <span class="text-sm font-medium">${record.type}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-sm text-gray-500">Created:</span>
                                        <span class="text-sm">${formatDate(record.created_at)}</span>
                                    </div>
                                </div>
                                <div class="mt-4 flex gap-2">
                                    <button onclick="viewRecord(${record.record_id})" class="flex-1 px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90">
                                        View Record
                                    </button>
                                    <button onclick="downloadRecord(${record.record_id})" class="flex-1 px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                                        Download
                                    </button>
                                </div>
                            </div>
                        `;
                    });
                }
            });
        });

        html += `</div>`;
        pageContent.innerHTML = html;
    }

    function loadClaims() {
        pageContent.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-[#cee0e8] dark:border-slate-800 shadow-sm p-6">
                <h3 class="text-lg font-bold mb-4">Claim Reviews</h3>
                <div class="space-y-4">
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="font-medium">Claim #CLM-2024-0152</h4>
                            <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Under Review</span>
                        </div>
                        <p class="text-sm text-gray-500 mb-3">Patient: John Doe - X-Ray Report</p>
                        <div class="flex gap-2">
                            <button class="px-3 py-1 bg-primary text-white text-sm rounded">Review</button>
                            <button class="px-3 py-1 border border-gray-300 text-sm rounded">Details</button>
                        </div>
                    </div>
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="font-medium">Claim #CLM-2024-0151</h4>
                            <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Approved</span>
                        </div>
                        <p class="text-sm text-gray-500 mb-3">Patient: Jane Smith - MRI Report</p>
                        <div class="flex gap-2">
                            <button class="px-3 py-1 bg-primary text-white text-sm rounded">View</button>
                            <button class="px-3 py-1 border border-gray-300 text-sm rounded">Download</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function loadDocuments() {
        pageContent.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-[#cee0e8] dark:border-slate-800 shadow-sm p-6">
                <h3 class="text-lg font-bold mb-4">Document Library</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="material-symbols-outlined text-primary">description</span>
                            <span class="font-medium">Claim Template</span>
                        </div>
                        <p class="text-sm text-gray-500">Standard claim form template</p>
                    </div>
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="material-symbols-outlined text-primary">folder</span>
                            <span class="font-medium">Policy Documents</span>
                        </div>
                        <p class="text-sm text-gray-500">Insurance policy documentation</p>
                    </div>
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="material-symbols-outlined text-primary">gavel</span>
                            <span class="font-medium">Legal Forms</span>
                        </div>
                        <p class="text-sm text-gray-500">Legal and compliance forms</p>
                    </div>
                </div>
            </div>
        `;
    }

    function loadAudit() {
        pageContent.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-[#cee0e8] dark:border-slate-800 shadow-sm">
                <div class="p-6 border-b border-[#cee0e8] dark:border-slate-800">
                    <h3 class="text-lg font-bold">Audit Log</h3>
                </div>
                <div class="p-6">
                    <div class="space-y-4">
                        <div class="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <span class="material-symbols-outlined text-blue-500">login</span>
                            <div class="flex-1">
                                <p class="font-medium">Logged into system</p>
                                <p class="text-sm text-gray-500">${new Date().toLocaleString()}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <span class="material-symbols-outlined text-green-500">check_circle</span>
                            <div class="flex-1">
                                <p class="font-medium">Access request approved</p>
                                <p class="text-sm text-gray-500">Claim #CLM-2024-0152</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <span class="material-symbols-outlined text-purple-500">visibility</span>
                            <div class="flex-1">
                                <p class="font-medium">Viewed medical record</p>
                                <p class="text-sm text-gray-500">John Doe - X-Ray Report</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function loadSettings() {
        pageContent.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-[#cee0e8] dark:border-slate-800 shadow-sm p-6">
                <h3 class="text-lg font-bold mb-4">Settings</h3>
                <div class="space-y-6">
                    <div>
                        <h4 class="font-medium mb-3">Notification Preferences</h4>
                        <div class="space-y-2">
                            <label class="flex items-center gap-2">
                                <input type="checkbox" class="rounded" checked>
                                <span class="text-sm">Email notifications for new requests</span>
                            </label>
                            <label class="flex items-center gap-2">
                                <input type="checkbox" class="rounded" checked>
                                <span class="text-sm">SMS alerts for urgent requests</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-medium mb-3">Account Information</h4>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium mb-1">Agent ID</label>
                                <input type="text" value="INS-001" class="w-full p-2 border rounded-lg" readonly>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Department</label>
                                <input type="text" value="MetLife Group A" class="w-full p-2 border rounded-lg" readonly>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function filterContent(query) {
        console.log('Searching for:', query);
    }

    function showRequestModal() {
        requestModal.classList.remove('hidden');
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
                <div class="w-1/3 flex flex-col bg-white dark:bg-slate-900 border border-[#cee0e8] dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div class="p-4 border-b border-[#cee0e8] dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-bold text-lg text-[#0d171c] dark:text-white">Chats</h3>
                            <button id="newChatBtn" class="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-primary">
                                <span class="material-symbols-outlined">add_comment</span>
                            </button>
                        </div>
                        <div class="relative">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">search</span>
                            <input type="text" id="searchConversations" placeholder="Search..." class="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary">
                        </div>
                    </div>
                    
                    <div id="conversationsList" class="flex-1 overflow-y-auto">
                        <div class="flex items-center justify-center h-20">
                            <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    </div>
                </div>

                <!-- Main: Chat Area -->
                <div class="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-[#cee0e8] dark:border-slate-800 rounded-xl overflow-hidden shadow-sm relative">
                    <!-- Chat Header -->
                    <div id="chatHeader" class="p-4 border-b border-[#cee0e8] dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white">
                                <span class="material-symbols-outlined">person</span>
                            </div>
                            <div>
                                <h3 id="currentChatName" class="font-bold text-[#0d171c] dark:text-white">Select a chat</h3>
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
                    <div id="messagesContainer" class="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/30 dark:bg-slate-950/30">
                        <div class="flex items-center justify-center h-full text-gray-500 flex-col gap-2">
                            <span class="material-symbols-outlined text-4xl">chat_bubble_outline</span>
                            <p>Select a conversation to start messaging</p>
                        </div>
                    </div>

                    <!-- Input Area -->
                    <div id="messageInputArea" class="p-4 bg-white dark:bg-slate-900 border-t border-[#cee0e8] dark:border-slate-800" style="display: none;">
                        <input type="file" id="fileInput" class="hidden">
                        <div id="fileUploadArea" class="hidden mb-2 p-2 bg-gray-100 dark:bg-slate-800 rounded flex items-center justify-between">
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
                                <span class="material-symbols-outlined">attach_file</span>
                            </button>
                            <textarea id="messageInput" rows="1" placeholder="Type a message..." class="flex-1 bg-gray-100 dark:bg-slate-800 border-none rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none max-h-32"></textarea>
                            <button id="sendBtn" class="p-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                                <span class="material-symbols-outlined">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- New Chat Modal -->
            <div id="newChatModal" class="hidden absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
                <div class="bg-white dark:bg-slate-900 border border-[#cee0e8] dark:border-slate-800 rounded-xl p-6 w-96 max-w-full shadow-2xl">
                    <h3 class="text-xl font-bold text-[#0d171c] dark:text-white mb-4">New Conversation</h3>
                    
                    <div class="mb-4">
                        <label class="block text-sm text-gray-500 mb-1">Select User</label>
                        <select id="userSelect" class="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded p-2 focus:outline-none focus:border-primary">
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

        if (window.Messenger) window.Messenger.init('pageContent');
    }
});

// Global functions
window.showRequestModal = function () {
    document.getElementById('requestModal').classList.remove('hidden');
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

window.downloadRecord = function (recordId) {
    window.showNotification('Download functionality would be implemented here', 'info');
};
