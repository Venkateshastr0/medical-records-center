// Team Lead Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    if (!requireAuth()) return;

    // Initialize
    let currentPage = 'overview';
    let teamMembers = [];
    let tasks = [];
    let analysisResults = [];
    let patients = [];

    // Connect to server
    medClient.connect();

    // DOM elements
    const pageContent = document.getElementById('pageContent');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');
    const taskModal = document.getElementById('taskModal');
    const taskForm = document.getElementById('taskForm');

    // Set user name
    if (medClient.currentUser) {
        userName.textContent = medClient.currentUser.name;
    }

    // Load initial data
    loadDashboardData();

    // Auto-refresh data every 30 seconds
    setInterval(loadDashboardData, 30000);

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

    // Task modal events
    document.getElementById('cancelTask').addEventListener('click', () => {
        taskModal.classList.add('hidden');
        taskForm.reset();
    });

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        assignTask();
    });

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
                subtitle: 'Team analysis management and coordination'
            },
            team: {
                title: 'My Team',
                subtitle: 'Manage team members and their assignments'
            },
            tasks: {
                title: 'Tasks',
                subtitle: 'Track and manage analysis tasks'
            },
            analysis: {
                title: 'Analysis Results',
                subtitle: 'Review and confirm team analysis results'
            },
            bundles: {
                title: 'Data Bundles',
                subtitle: 'Create and manage patient data bundles'
            },
            cloud: {
                title: 'Cloud Storage',
                subtitle: 'Manage secure cloud storage and backups'
            },
            messenger: {
                title: 'Messenger',
                subtitle: 'Secure communication with your team'
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
            case 'team':
                loadTeam();
                break;
            case 'tasks':
                loadTasks();
                break;
            case 'analysis':
                loadAnalysis();
                break;
            case 'bundles':
                loadBundles();
                break;
            case 'cloud':
                loadCloud();
                break;
            case 'messenger':
                loadMessenger();
                break;
            default:
                loadOverview();
        }
    }

    async function loadDashboardData() {
        try {
            // Load team members
            const teamResponse = await fetch('/api/analysis/team-members', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (teamResponse.ok) {
                const teamData = await teamResponse.json();
                teamMembers = teamData.teamMembers || [];
            }

            // Load tasks
            const tasksResponse = await fetch('/api/analysis/tasks', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (tasksResponse.ok) {
                const tasksData = await tasksResponse.json();
                tasks = tasksData.tasks || [];
            }

            // Load analysis results
            const resultsResponse = await fetch('/api/analysis/results', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (resultsResponse.ok) {
                const resultsData = await resultsResponse.json();
                analysisResults = resultsData.results || [];
            }

            // Load patients
            const patientsResponse = await fetch('/api/patients', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (patientsResponse.ok) {
                const patientsData = await patientsResponse.json();
                patients = patientsData.patients || [];
            }

            loadPage(currentPage);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    function loadOverview() {
        const stats = {
            totalTeamMembers: teamMembers.length,
            activeTasks: tasks.filter(t => t.status === 'assigned' || t.status === 'in_progress').length,
            completedTasks: tasks.filter(t => t.status === 'completed').length,
            pendingConfirmation: analysisResults.filter(r => r.status === 'draft').length,
            confirmedAnalysis: analysisResults.filter(r => r.status === 'confirmed').length
        };

        pageContent.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-600">Team Members</span>
                        <span class="material-symbols-outlined text-primary">people</span>
                    </div>
                    <div class="text-2xl font-bold text-gray-900">${stats.totalTeamMembers}</div>
                    <div class="text-xs text-gray-600">Active analysts</div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-600">Active Tasks</span>
                        <span class="material-symbols-outlined text-warning">assignment</span>
                    </div>
                    <div class="text-2xl font-bold text-gray-900">${stats.activeTasks}</div>
                    <div class="text-xs text-gray-600">In progress</div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-600">Completed</span>
                        <span class="material-symbols-outlined text-success">check_circle</span>
                    </div>
                    <div class="text-2xl font-bold text-gray-900">${stats.completedTasks}</div>
                    <div class="text-xs text-gray-600">Tasks finished</div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-600">Pending Review</span>
                        <span class="material-symbols-outlined text-secondary">pending</span>
                    </div>
                    <div class="text-2xl font-bold text-gray-900">${stats.pendingConfirmation}</div>
                    <div class="text-xs text-gray-600">Awaiting confirmation</div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-gray-600">Confirmed</span>
                        <span class="material-symbols-outlined text-success">verified</span>
                    </div>
                    <div class="text-2xl font-bold text-gray-900">${stats.confirmedAnalysis}</div>
                    <div class="text-xs text-gray-600">Analysis confirmed</div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">Recent Tasks</h3>
                        <button onclick="showTaskModal()" class="px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-primary/90">
                            Assign New
                        </button>
                    </div>
                    <div class="space-y-3">
                        ${tasks.slice(0, 5).map(task => `
                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <div class="font-medium text-gray-900">${task.task_type}</div>
                                    <div class="text-sm text-gray-600">${task.patient_name} • ${task.assigned_to_name}</div>
                                </div>
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                task.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
            }">${task.status}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Pending Confirmation</h3>
                    <div class="space-y-3">
                        ${analysisResults.filter(r => r.status === 'draft').slice(0, 5).map(result => `
                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <div class="font-medium text-gray-900">${result.patient_name}</div>
                                    <div class="text-sm text-gray-600">${result.analyst_name} • ${result.task_type}</div>
                                </div>
                                <button onclick="confirmAnalysis(${result.result_id})" class="px-3 py-1 bg-secondary text-white text-sm rounded-lg hover:bg-secondary/90">
                                    Review
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    function loadTeam() {
        pageContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold text-gray-900">Team Members</h3>
                    <button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                        <span class="material-symbols-outlined text-sm">add</span>
                        Add Member
                    </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="border-b border-gray-200">
                                <th class="pb-3 text-sm font-medium text-gray-900">Name</th>
                                <th class="pb-3 text-sm font-medium text-gray-900">Role</th>
                                <th class="pb-3 text-sm font-medium text-gray-900">Specialization</th>
                                <th class="pb-3 text-sm font-medium text-gray-900">Status</th>
                                <th class="pb-3 text-sm font-medium text-gray-900">Active Tasks</th>
                                <th class="pb-3 text-sm font-medium text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${teamMembers.map(member => {
            const activeTasks = tasks.filter(t => t.assigned_to === member.member_id && t.status !== 'completed').length;
            return `
                                    <tr class="hover:bg-gray-50">
                                        <td class="py-3 text-sm font-medium text-gray-900">${member.name}</td>
                                        <td class="py-3 text-sm text-gray-600">${member.role}</td>
                                        <td class="py-3 text-sm text-gray-600">${member.specialization || 'General'}</td>
                                        <td class="py-3">
                                            <span class="px-2 py-1 text-xs font-medium rounded-full ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }">${member.status}</span>
                                        </td>
                                        <td class="py-3 text-sm text-gray-600">${activeTasks}</td>
                                        <td class="py-3 text-sm">
                                            <button onclick="assignTaskToMember(${member.member_id})" class="text-primary hover:text-primary/80">Assign Task</button>
                                        </td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function loadTasks() {
        pageContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold text-gray-900">Analysis Tasks</h3>
                    <button onclick="showTaskModal()" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                        <span class="material-symbols-outlined text-sm">add</span>
                        Assign Task
                    </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="border-b border-gray-200">
                                <th class="pb-3 text-sm font-medium text-gray-900">Patient</th>
                                <th class="pb-3 text-sm font-medium text-gray-900">Task Type</th>
                                <th class="pb-3 text-sm font-medium text-gray-900">Assigned To</th>
                                <th class="pb-3 text-sm font-medium text-gray-900">Priority</th>
                                <th class="pb-3 text-sm font-medium text-gray-900">Status</th>
                                <th class="pb-3 text-sm font-medium text-gray-900">Deadline</th>
                                <th class="pb-3 text-sm font-medium text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${tasks.map(task => `
                                <tr class="hover:bg-gray-50">
                                    <td class="py-3 text-sm font-medium text-gray-900">${task.patient_name}</td>
                                    <td class="py-3 text-sm text-gray-600">${task.task_type}</td>
                                    <td class="py-3 text-sm text-gray-600">${task.assigned_to_name}</td>
                                    <td class="py-3">
                                        <span class="px-2 py-1 text-xs font-medium rounded-full ${task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
            }">${task.priority}</span>
                                    </td>
                                    <td class="py-3">
                                        <span class="px-2 py-1 text-xs font-medium rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                task.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
            }">${task.status}</span>
                                    </td>
                                    <td class="py-3 text-sm text-gray-600">${task.deadline ? formatDate(task.deadline) : 'No deadline'}</td>
                                    <td class="py-3 text-sm">
                                        <button onclick="viewTaskDetails(${task.task_id})" class="text-primary hover:text-primary/80">View</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function loadAnalysis() {
        pageContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-6">Analysis Results</h3>
                <div class="space-y-4">
                    ${analysisResults.map(result => `
                        <div class="border border-gray-200 rounded-lg p-4">
                            <div class="flex items-start justify-between mb-3">
                                <div>
                                    <h4 class="font-medium text-gray-900">${result.patient_name} • ${result.task_type}</h4>
                                    <p class="text-sm text-gray-600">By ${result.analyst_name} • ${formatDate(result.created_at)}</p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="px-2 py-1 text-xs font-medium rounded-full ${result.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                result.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
            }">${result.status}</span>
                                    ${result.confidence_score ? `
                                        <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                            ${result.confidence_score}% Confidence
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <h5 class="font-medium text-gray-900 mb-1">Findings:</h5>
                                <p class="text-sm text-gray-600">${result.findings}</p>
                            </div>
                            
                            <div class="mb-3">
                                <h5 class="font-medium text-gray-900 mb-1">Recommendations:</h5>
                                <p class="text-sm text-gray-600">${result.recommendations}</p>
                            </div>
                            
                            ${result.status === 'draft' ? `
                                <div class="flex gap-2">
                                    <button onclick="confirmAnalysis(${result.result_id})" class="px-3 py-1 bg-success text-white text-sm rounded-lg hover:bg-success/90">
                                        Confirm
                                    </button>
                                    <button onclick="rejectAnalysis(${result.result_id})" class="px-3 py-1 bg-danger text-white text-sm rounded-lg hover:bg-danger/90">
                                        Reject
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function loadBundles() {
        pageContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold text-gray-900">Data Bundles</h3>
                    <button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                        <span class="material-symbols-outlined text-sm">add</span>
                        Create Bundle
                    </button>
                </div>
                <div class="text-center py-12">
                    <span class="material-symbols-outlined text-4xl text-gray-400 mb-4">folder</span>
                    <p class="text-gray-600">Data bundles will appear here</p>
                    <p class="text-sm text-gray-500">Create bundles to organize patient data for analysis</p>
                </div>
            </div>
        `;
    }

    function loadCloud() {
        pageContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-6">Cloud Storage</h3>
                <div class="text-center py-12">
                    <span class="material-symbols-outlined text-4xl text-gray-400 mb-4">cloud</span>
                    <p class="text-gray-600">Cloud storage status</p>
                    <p class="text-sm text-gray-500">Confirmed analysis results are automatically uploaded to secure cloud storage</p>
                </div>
            </div>
        `;
    }

    // Global functions
    window.showTaskModal = function () {
        taskModal.classList.remove('hidden');
        populateSelects();
    };

    window.assignTaskToMember = function (memberId) {
        document.getElementById('memberSelect').value = memberId;
        showTaskModal();
    };

    window.confirmAnalysis = function (resultId) {
        if (confirm('Are you sure you want to confirm this analysis? It will be uploaded to cloud storage.')) {
            fetch(`/api/analysis/results/${resultId}/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ confirmed: true })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showNotification('Analysis confirmed and uploaded to cloud', 'success');
                        loadDashboardData();
                    } else {
                        showNotification('Failed to confirm analysis', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error confirming analysis:', error);
                    showNotification('Failed to confirm analysis', 'error');
                });
        }
    };

    window.rejectAnalysis = function (resultId) {
        const feedback = prompt('Please provide feedback for rejection:');
        if (feedback) {
            fetch(`/api/analysis/results/${resultId}/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ confirmed: false, feedback })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showNotification('Analysis rejected', 'success');
                        loadDashboardData();
                    } else {
                        showNotification('Failed to reject analysis', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error rejecting analysis:', error);
                    showNotification('Failed to reject analysis', 'error');
                });
        }
    };

    window.viewTaskDetails = function (taskId) {
        showNotification('Task details feature coming soon', 'info');
    };

    function populateSelects() {
        // Populate patient select
        const patientSelect = document.getElementById('patientSelect');
        patientSelect.innerHTML = '<option value="">Select patient...</option>';
        patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.patient_id;
            option.textContent = patient.name;
            patientSelect.appendChild(option);
        });

        // Populate member select
        const memberSelect = document.getElementById('memberSelect');
        memberSelect.innerHTML = '<option value="">Select team member...</option>';
        teamMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = member.member_id;
            option.textContent = `${member.name} (${member.specialization || 'General'})`;
            memberSelect.appendChild(option);
        });
    }

    async function assignTask() {
        const formData = new FormData(taskForm);
        const taskData = {
            patientId: formData.get('patientId') || document.getElementById('patientSelect').value,
            assignedTo: formData.get('assignedTo') || document.getElementById('memberSelect').value,
            taskType: document.getElementById('taskType').value,
            priority: document.getElementById('priority').value,
            instructions: document.getElementById('instructions').value,
            deadline: document.getElementById('deadline').value
        };
        function loadMessenger() {
            const pageContent = document.getElementById('pageContent');
            if (pageContent.dataset.messengerInterval) {
                clearInterval(Number(pageContent.dataset.messengerInterval));
            }

            pageContent.innerHTML = `
            <div class="flex h-[calc(100vh-200px)] gap-4">
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

                <div class="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm relative">
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
                    </div>
                    
                    <div id="messagesContainer" class="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                        <div class="flex items-center justify-center h-full text-gray-500 flex-col gap-2">
                             <span class="material-symbols-outlined text-4xl">chat_bubble_outline</span>
                            <p>Select a conversation to start messaging</p>
                        </div>
                    </div>

                    <div id="messageInputArea" class="p-4 bg-white border-t border-gray-200" style="display: none;">
                        <input type="file" id="fileInput" class="hidden">
                         <div id="fileUploadArea" class="hidden mb-2 p-2 bg-gray-50 rounded flex items-center justify-between">
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
                            <textarea id="messageInput" rows="1" placeholder="Type a message..." class="flex-1 bg-gray-50 border-none rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none max-h-32"></textarea>
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
                        <select id="userSelect" class="w-full bg-white border border-gray-200 rounded p-2 focus:outline-none focus:border-primary">
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

        try {
            const response = await fetch('/api/analysis/tasks/assign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(taskData)
            });

            const data = await response.json();
            if (data.success) {
                showNotification('Task assigned successfully', 'success');
                taskModal.classList.add('hidden');
                taskForm.reset();
                loadDashboardData();
            } else {
                showNotification('Failed to assign task', 'error');
            }
        } catch (error) {
            console.error('Error assigning task:', error);
            showNotification('Failed to assign task', 'error');
        }
    }
});
