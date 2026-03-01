// Developer Dashboard - Dark Theme Terminal Interface
document.addEventListener('DOMContentLoaded', function () {
    // Check authentication (only developers can access)
    if (!requireAuth()) return;

    // Initialize
    let currentPage = 'overview';
    let systemStats = {};
    let securityAlerts = [];
    let systemLogs = [];
    let performanceMetrics = {};

    // Connect to server
    medClient.connect();

    // DOM elements
    const pageContent = document.getElementById('pageContent');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const refreshBtn = document.getElementById('refreshBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Load initial data
    loadDashboardData();

    // Auto-refresh every 30 seconds
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
    refreshBtn.addEventListener('click', () => {
        showNotification('Refreshing system data...', 'info');
        loadDashboardData();
    });

    logoutBtn.addEventListener('click', () => medClient.logout());

    // Functions
    function setActiveNav(page) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('bg-panel', 'border', 'border-primary/30', 'text-primary');
            item.classList.add('hover:bg-panel');
        });

        const activeItem = document.querySelector(`[data-page="${page}"]`);
        if (activeItem) {
            activeItem.classList.add('bg-panel', 'border', 'border-primary/30', 'text-primary');
            activeItem.classList.remove('hover:bg-panel');
        }

        currentPage = page;
        updatePageHeader(page);
    }

    function updatePageHeader(page) {
        const headers = {
            overview: {
                title: 'System Overview',
                subtitle: 'Real-time system monitoring and control'
            },
            security: {
                title: 'Security Monitor',
                subtitle: 'Threat detection and security analytics'
            },
            logs: {
                title: 'System Logs',
                subtitle: 'Real-time system event monitoring'
            },
            performance: {
                title: 'Performance Metrics',
                subtitle: 'System performance and resource utilization'
            },
            admin: {
                title: 'Admin Control',
                subtitle: 'System administration and user management'
            },
            admin: {
                title: 'Admin Control',
                subtitle: 'System administration and user management'
            },
            api: {
                title: 'API Monitor',
                subtitle: 'API usage and endpoint monitoring'
            },
            messenger: {
                title: 'Secure Messenger',
                subtitle: 'Encrypted communication channel'
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
            case 'security':
                loadSecurityMonitor();
                break;
            case 'logs':
                loadSystemLogs();
                break;
            case 'performance':
                loadPerformanceMetrics();
                break;
            case 'admin':
                loadAdminControl();
                break;
            case 'api':
                loadAPIMonitor();
                break;
            case 'messenger':
                loadMessenger();
                break;
            default:
                loadOverview();
        }
    }

    function loadDashboardData() {
        medClient.getSystemStats((response) => {
            if (response.success) {
                systemStats = response.stats;
                loadPage(currentPage);
            } else {
                showNotification('Failed to load system stats: ' + response.message, 'error');
            }
        });
    }

    function loadOverview() {
        // Safe check for data
        if (!systemStats.server) return;

        pageContent.innerHTML = `
            <!-- System Status Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="bg-panel border border-dark rounded-lg p-4 cyber-border">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-muted text-sm">SERVER STATUS</span>
                        <span class="material-symbols-outlined text-success text-lg">check_circle</span>
                    </div>
                    <div class="terminal-font">
                        <div class="text-2xl font-bold text-success">ONLINE</div>
                        <div class="text-xs text-muted">Uptime: ${systemStats.server.uptime}</div>
                        <div class="text-xs text-terminal-blue mt-1">IP: ${systemStats.server.ip}:3000</div>
                    </div>
                </div>

                <div class="bg-panel border border-dark rounded-lg p-4 cyber-border">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-muted text-sm">CPU USAGE</span>
                        <span class="material-symbols-outlined text-primary text-lg">memory</span>
                    </div>
                    <div class="terminal-font">
                        <div class="text-2xl font-bold text-primary">${systemStats.server.cpu}%</div>
                        <div class="w-full bg-darker rounded-full h-2 mt-2">
                            <div class="bg-primary h-2 rounded-full" style="width: ${systemStats.server.cpu}%"></div>
                        </div>
                    </div>
                </div>

                <div class="bg-panel border border-dark rounded-lg p-4 cyber-border">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-muted text-sm">MEMORY</span>
                        <span class="material-symbols-outlined text-secondary text-lg">storage</span>
                    </div>
                    <div class="terminal-font">
                        <div class="text-2xl font-bold text-secondary">${systemStats.server.memory}GB</div>
                        <div class="text-xs text-muted">8GB Total</div>
                    </div>
                </div>

                <div class="bg-panel border border-dark rounded-lg p-4 cyber-border">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-muted text-sm">SECURITY</span>
                        <span class="material-symbols-outlined text-warning text-lg">security</span>
                    </div>
                    <div class="terminal-font">
                        <div class="text-2xl font-bold text-warning">${systemStats.security.threats}</div>
                        <div class="text-xs text-muted">Threats Detected</div>
                    </div>
                </div>
            </div>

            <!-- Terminal Window -->
            <div class="bg-panel border border-dark rounded-lg p-4 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">terminal</span>
                        <span class="terminal-font text-sm">SYSTEM_TERMINAL</span>
                    </div>
                    <div class="flex gap-2">
                        <span class="w-2 h-2 bg-success rounded-full status-online"></span>
                        <span class="text-xs text-muted">CONNECTED</span>
                    </div>
                </div>
                <div class="code-block">
                    <div class="text-terminal-green">$ ./system-status --verbose</div>
                    <div class="text-muted">[2026-02-04 00:20:15] System initialized successfully</div>
                    <div class="text-muted">[2026-02-04 00:20:16] Database connection established</div>
                    <div class="text-muted">[2026-02-04 00:20:17] Security protocols activated</div>
                    <div class="text-muted">[2026-02-04 00:20:18] API endpoints ready</div>
                    <div class="text-primary">[2026-02-04 00:20:19] All systems operational</div>
                    <div class="text-terminal-green">$ █</div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-panel border border-dark rounded-lg p-4">
                    <a href="#" class="nav-item flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-panel transition-colors" data-page="api">
                        <span class="material-symbols-outlined">api</span>
                        <span class="text-sm">API Monitor</span>
                    </a>
                    <a href="#" class="nav-item flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-panel transition-colors" data-page="messenger">
                        <span class="material-symbols-outlined">chat</span>
                        <span class="text-sm">Messenger</span>
                    </a>
                    <div class="space-y-2">
                        <button onclick="executeCommand('restart-service')" class="w-full text-left px-3 py-2 bg-darker border border-dark rounded hover:bg-hover transition-colors terminal-font text-sm">
                            <span class="text-primary">$</span> restart-service
                        </button>
                        <button onclick="executeCommand('clear-cache')" class="w-full text-left px-3 py-2 bg-darker border border-dark rounded hover:bg-hover transition-colors terminal-font text-sm">
                            <span class="text-primary">$</span> clear-cache
                        </button>
                        <button onclick="executeCommand('backup-database')" class="w-full text-left px-3 py-2 bg-darker border border-dark rounded hover:bg-hover transition-colors terminal-font text-sm">
                            <span class="text-primary">$</span> backup-database
                        </button>
                        <button onclick="executeCommand('security-scan')" class="w-full text-left px-3 py-2 bg-darker border border-dark rounded hover:bg-hover transition-colors terminal-font text-sm">
                            <span class="text-primary">$</span> security-scan
                        </button>
                    </div>
                </div>

                <div class="bg-panel border border-dark rounded-lg p-4">
                    <h3 class="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                        <span class="material-symbols-outlined">notifications</span>
                        System Alerts
                    </h3>
                    <div class="space-y-3">
                        <div class="flex items-start gap-3 p-2 bg-warning/10 border border-warning/30 rounded">
                            <span class="material-symbols-outlined text-warning text-sm">warning</span>
                            <div class="flex-1">
                                <div class="text-sm font-medium text-warning">High Memory Usage</div>
                                <div class="text-xs text-muted">Memory usage at 78% capacity</div>
                                <div class="text-xs text-muted mt-1">2 minutes ago</div>
                            </div>
                        </div>
                        <div class="flex items-start gap-3 p-2 bg-success/10 border border-success/30 rounded">
                            <span class="material-symbols-outlined text-success text-sm">check_circle</span>
                            <div class="flex-1">
                                <div class="text-sm font-medium text-success">Backup Completed</div>
                                <div class="text-xs text-muted">Database backup successful</div>
                                <div class="text-xs text-muted mt-1">15 minutes ago</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function loadSecurityMonitor() {
        pageContent.innerHTML = `
            <!-- Security Overview -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-panel border border-dark rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-muted text-sm">THREAT LEVEL</span>
                        <span class="material-symbols-outlined text-warning text-lg">warning</span>
                    </div>
                    <div class="terminal-font">
                        <div class="text-2xl font-bold text-warning">MEDIUM</div>
                        <div class="text-xs text-muted">${systemStats.security.threats} active threats</div>
                    </div>
                </div>

                <div class="bg-panel border border-dark rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-muted text-sm">BLOCKED TODAY</span>
                        <span class="material-symbols-outlined text-success text-lg">block</span>
                    </div>
                    <div class="terminal-font">
                        <div class="text-2xl font-bold text-success">${systemStats.security.blocked}</div>
                        <div class="text-xs text-muted">Malicious attempts</div>
                    </div>
                </div>

                <div class="bg-panel border border-dark rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-muted text-sm">SECURITY SCORE</span>
                        <span class="material-symbols-outlined text-primary text-lg">shield</span>
                    </div>
                    <div class="terminal-font">
                        <div class="text-2xl font-bold text-primary">94/100</div>
                        <div class="text-xs text-muted">Overall security rating</div>
                    </div>
                </div>
            </div>

            <!-- Security Events -->
            <div class="bg-panel border border-dark rounded-lg p-4">
                <h3 class="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                    <span class="material-symbols-outlined">security</span>
                    Recent Security Events
                </h3>
                <div class="code-block">
                    <div class="space-y-2">
                        <div class="flex items-center gap-3">
                            <span class="text-terminal-red">[BLOCKED]</span>
                            <span class="text-muted">192.168.1.100</span>
                            <span class="text-muted">SQL Injection Attempt</span>
                            <span class="text-muted">2 min ago</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-terminal-blue">[DETECTED]</span>
                            <span class="text-muted">10.0.0.15</span>
                            <span class="text-muted">Brute Force Attack</span>
                            <span class="text-muted">5 min ago</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-terminal-green">[ALLOWED]</span>
                            <span class="text-muted">admin@medrecord.com</span>
                            <span class="text-muted">Successful Login</span>
                            <span class="text-muted">10 min ago</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-terminal-yellow">[WARNING]</span>
                            <span class="text-muted">user@medrecord.com</span>
                            <span class="text-muted">Multiple Failed Attempts</span>
                            <span class="text-muted">15 min ago</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function loadSystemLogs() {
        pageContent.innerHTML = `
            <div class="bg-panel border border-dark rounded-lg p-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-primary flex items-center gap-2">
                        <span class="material-symbols-outlined">terminal</span>
                        Live System Logs
                    </h3>
                    <div class="flex gap-2">
                        <button onclick="clearLogs()" class="px-3 py-1 bg-darker border border-dark rounded text-xs terminal-font hover:bg-hover">
                            CLEAR
                        </button>
                        <button onclick="exportLogs()" class="px-3 py-1 bg-darker border border-dark rounded text-xs terminal-font hover:bg-hover">
                            EXPORT
                        </button>
                    </div>
                </div>
                <div class="code-block h-96 overflow-y-auto" id="logContainer">
                    <div class="space-y-1">
                        <div class="text-terminal-green">[INFO] System startup initiated</div>
                        <div class="text-muted">[DEBUG] Loading configuration files...</div>
                        <div class="text-primary">[SUCCESS] Database connection established</div>
                        <div class="text-muted">[DEBUG] Initializing security protocols...</div>
                        <div class="text-primary">[SUCCESS] Security protocols loaded</div>

    function loadPerformanceMetrics() {
        pageContent.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-panel border border-dark rounded-lg p-4">
                    <h3 class="text-lg font-bold text-primary mb-4">Resource Usage</h3>
                    <div class="space-y-4">
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span>CPU Usage</span>
                                <span>${systemStats.server.cpu}%</span>
                            </div>
                            <div class="w-full bg-darker rounded-full h-2">
                                <div class="bg-primary h-2 rounded-full" style="width: ${systemStats.server.cpu}%"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span>Memory Usage</span>
                                <span>${(systemStats.server.memory / 8 * 100).toFixed(1)}%</span>
                            </div>
                            <div class="w-full bg-darker rounded-full h-2">
                                <div class="bg-secondary h-2 rounded-full" style="width: ${(systemStats.server.memory / 8 * 100)}%"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span>Disk Usage</span>
                                <span>${systemStats.server.disk}%</span>
                            </div>
                            <div class="w-full bg-darker rounded-full h-2">
                                <div class="bg-warning h-2 rounded-full" style="width: ${systemStats.server.disk}%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-panel border border-dark rounded-lg p-4">
                    <h3 class="text-lg font-bold text-primary mb-4">Database Performance</h3>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-sm text-muted">Active Connections</span>
                            <span class="terminal-font">${systemStats.database.connections}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm text-muted">Queries/Second</span>
                            <span class="terminal-font">${systemStats.database.queries}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm text-muted">Avg Response Time</span>
                            <span class="terminal-font">${systemStats.database.avgResponse}ms</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-sm text-muted">Error Rate</span>
                            <span class="terminal-font text-success">${systemStats.database.errors}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function loadAdminControl() {
        // Fetch pending registrations
        medClient.getPendingRegistrations((response) => {
            let pendingHtml = '';

            if (response.success && response.registrations.length > 0) {
                pendingHtml = `
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="border-b border-darker text-xs text-muted">
                                    <th class="p-2">NAME</th>
                                    <th class="p-2">ROLE</th>
                                    <th class="p-2">ORGANIZATION</th>
                                    <th class="p-2">DATE</th>
                                    <th class="p-2">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody class="text-sm">
                                ${response.registrations.map(reg => `
                                    <tr class="border-b border-darker hover:bg-darker/50 transition-colors">
                                        <td class="p-2 font-medium text-primary">${reg.name}</td>
                                        <td class="p-2 text-secondary">${reg.role}</td>
                                        <td class="p-2 text-muted">${reg.organization || '-'}</td>
                                        <td class="p-2 text-muted text-xs">${new Date(reg.submitted_at).toLocaleDateString()}</td>
                                        <td class="p-2 flex gap-2">
                                            <button onclick="approveUser(${reg.registration_id})" class="px-2 py-1 bg-success/20 text-success border border-success/30 rounded text-xs hover:bg-success/30">
                                                APPROVE
                                            </button>
                                            <button onclick="rejectUser(${reg.registration_id})" class="px-2 py-1 bg-warning/20 text-warning border border-warning/30 rounded text-xs hover:bg-warning/30">
                                                REJECT
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                pendingHtml = `<div class="p-4 text-center text-muted text-sm">No pending registrations found.</div>`;
            }

            pageContent.innerHTML = `
                <div class="bg-panel border border-dark rounded-lg p-4 mb-6">
                    <h3 class="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                        <span class="material-symbols-outlined">group_add</span>
                        Pending Registrations
                    </h3>
                    ${pendingHtml}
                </div>

                <div class="bg-panel border border-dark rounded-lg p-4">
                    <h3 class="text-lg font-bold text-primary mb-4">System Administration</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 class="text-md font-medium text-secondary mb-3">User Management</h4>
                            <div class="space-y-2">
                                <button onclick="openUserModal()" class="w-full px-3 py-2 bg-darker border border-dark rounded hover:bg-hover terminal-font text-sm text-left">
                                    <span class="text-primary">$</span> manage-all-users
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    // Expose functions to window
    window.approveUser = function (id) {
        showNotification('Approving user...', 'info');
        medClient.approveRegistration(id, (response) => {
            if (response.success) {
                showNotification('User approved successfully', 'success');
                loadAdminControl(); // Refresh list
            } else {
                showNotification('Error: ' + response.message, 'error');
            }
        });
    };

    function loadMessenger() {
        // Clear interval if exists
        const oldContent = document.getElementById('pageContent');
        if (oldContent && oldContent.dataset.messengerInterval) {
            clearInterval(Number(oldContent.dataset.messengerInterval));
        }

        pageContent.innerHTML = `
            <div class="flex h-[calc(100vh-200px)] gap-4">
                <!-- Sidebar: Conversations -->
                <div class="w-1/3 flex flex-col bg-panel border border-dark rounded-lg overflow-hidden">
                    <div class="p-4 border-b border-dark bg-darker">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-bold text-lg text-primary">Chats</h3>
                            <button id="newChatBtn" class="p-2 hover:bg-white/10 rounded-full transition-colors text-primary">
                                <span class="material-symbols-outlined">add_comment</span>
                            </button>
                        </div>
                        <div class="relative">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">search</span>
                            <input type="text" id="searchConversations" placeholder="Search..." class="w-full bg-black/20 border border-dark rounded-full py-2 pl-9 pr-4 text-sm text-gray-200 focus:outline-none focus:border-primary">
                        </div>
                    </div>
                    
                    <div id="conversationsList" class="flex-1 overflow-y-auto scrollbar-thin">
                        <!-- Conversations will be loaded here -->
                        <div class="flex items-center justify-center h-20">
                            <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    </div>
                </div>

                <!-- Main: Chat Area -->
                <div class="flex-1 flex flex-col bg-panel border border-dark rounded-lg overflow-hidden relative">
                    <!-- Chat Header -->
                    <div id="chatHeader" class="p-4 border-b border-dark bg-darker flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                                <span class="material-symbols-outlined text-white">person</span>
                            </div>
                            <div>
                                <h3 id="currentChatName" class="font-bold text-gray-200">Select a chat</h3>
                                <div id="currentChatStatus" class="flex items-center gap-2 text-xs text-gray-500">
                                    <span class="w-2 h-2 bg-gray-500 rounded-full"></span>
                                    Offline
                                </div>
                            </div>
                        </div>
                        <button class="text-gray-400 hover:text-white">
                            <span class="material-symbols-outlined">more_vert</span>
                        </button>
                    </div>

                    <!-- Messages Area -->
                    <div id="messagesContainer" class="flex-1 p-4 overflow-y-auto scrollbar-thin space-y-4 bg-dots-pattern">
                        <!-- Messages will appear here -->
                        <div class="flex items-center justify-center h-full text-gray-500 flex-col gap-2">
                            <span class="material-symbols-outlined text-4xl">chat_bubble_outline</span>
                            <p>Select a conversation to start messaging</p>
                        </div>
                    </div>

                    <!-- Input Area -->
                    <div id="messageInputArea" class="p-4 bg-darker border-t border-dark" style="display: none;">
                        <div id="fileUploadArea" class="hidden mb-2 p-2 bg-black/20 rounded flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">description</span>
                                <span id="fileName" class="text-xs text-gray-300">filename.pdf</span>
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
                            
                            <textarea id="messageInput" rows="1" placeholder="Type a message..." class="flex-1 bg-black/20 border border-dark rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-primary resize-none max-h-32 scrollbar-thin"></textarea>
                            
                            <button id="sendBtn" class="p-3 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                                <span class="material-symbols-outlined">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- New Chat Modal -->
            <div id="newChatModal" class="hidden absolute inset-0 bg-black/80 z-50 flex items-center justify-center">
                <div class="bg-panel border border-dark rounded-lg p-6 w-96 max-w-full shadow-2xl">
                    <h3 class="text-xl font-bold text-white mb-4">New Conversation</h3>
                    
                    <div class="mb-4">
                        <label class="block text-sm text-gray-400 mb-1">Select User</label>
                        <select id="userSelect" class="w-full bg-darker border border-dark rounded p-2 text-white focus:outline-none focus:border-primary">
                            <option value="">Loading users...</option>
                        </select>
                    </div>
                    
                    <div class="flex justify-end gap-3">
                        <button id="cancelNewChat" class="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                        <button id="startNewChat" class="px-4 py-2 bg-primary text-black rounded hover:bg-primary/90 transition-colors">Start Chat</button>
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



    function loadAPIMonitor() {
        pageContent.innerHTML = `
            <div class="bg-panel border border-dark rounded-lg p-4">
                <h3 class="text-lg font-bold text-primary mb-4">API Endpoint Monitor</h3>
                <div class="code-block">
                    <div class="space-y-2">
                        <div class="flex items-center gap-4">
                            <span class="text-terminal-green">●</span>
                            <span class="text-muted">POST /api/login</span>
                            <span class="text-success">200 OK</span>
                            <span class="text-muted">23ms</span>
                            <span class="text-muted">2/sec</span>
                        </div>
                        <div class="flex items-center gap-4">
                            <span class="text-terminal-green">●</span>
                            <span class="text-muted">GET /api/patients</span>
                            <span class="text-success">200 OK</span>
                            <span class="text-muted">45ms</span>
                            <span class="text-muted">1/sec</span>
                        </div>
                        <div class="flex items-center gap-4">
                            <span class="text-terminal-yellow">●</span>
                            <span class="text-muted">POST /api/records</span>
                            <span class="text-warning">201 Created</span>
                            <span class="text-muted">156ms</span>
                            <span class="text-muted">0.5/sec</span>
                        </div>
                        <div class="flex items-center gap-4">
                            <span class="text-terminal-red">●</span>
                            <span class="text-muted">GET /api/admin/users</span>
                            <span class="text-danger">403 Forbidden</span>
                            <span class="text-muted">12ms</span>
                            <span class="text-muted">0.1/sec</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Global functions
    window.executeCommand = function (command) {
        showNotification(`Executing: ${command}`, 'info');
        // Simulate command execution
        setTimeout(() => {
            showNotification(`Command '${command}' executed successfully`, 'success');
        }, 1500);
    };

    window.clearLogs = function () {
        const logContainer = document.getElementById('logContainer');
        if (logContainer) {
            logContainer.innerHTML = '<div class="text-terminal-green">[INFO] Logs cleared</div>';
        }
    };

    window.exportLogs = function () {
        showNotification('Exporting logs...', 'info');
        setTimeout(() => {
            showNotification('Logs exported successfully', 'success');
        }, 1000);
    };

    window.systemMaintenance = function () {
        showAlertModal('System Maintenance', 'System will enter maintenance mode. All users will be logged out.');
    };

    window.systemBackup = function () {
        showNotification('Starting system backup...', 'info');
        setTimeout(() => {
            showNotification('System backup completed successfully', 'success');
        }, 3000);
    };

    window.systemUpdate = function () {
        showAlertModal('System Update', 'A new system update is available. Update requires system restart.');
    };

    window.openUserModal = function () {
        showNotification('User management interface', 'info');
    };

    window.openRoleModal = function () {
        showNotification('Role assignment interface', 'info');
    };

    window.openPermissionModal = function () {
        showNotification('Permission management interface', 'info');
    };

    window.showAlertModal = function (title, message) {
        document.getElementById('alertTitle').textContent = title;
        document.getElementById('alertMessage').textContent = message;
        document.getElementById('alertModal').classList.remove('hidden');
    };

    window.closeAlertModal = function () {
        document.getElementById('alertModal').classList.add('hidden');
    };
});
