// Socket.io Client for Medical Records Center
class MedicalRecordsClient {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.isConnected = false;
    }

    // Connect to server
    connect() {
        // Use relative path for connection to work on both localhost and LAN IP
        this.socket = io();

        this.socket.on('connect', () => {
            console.log('✅ Connected to Medical Records Server');
            this.isConnected = true;
            this.onConnect();
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
            this.isConnected = false;
            this.onDisconnect();
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error);
            this.onConnectionError(error);
        });

        // Handle incoming notifications
        this.socket.on('newNotification', (notification) => {
            this.onNotification(notification);
        });
    }

    // Login method
    login(username, password, callback) {
        if (!this.isConnected) {
            return callback({ success: false, message: 'Not connected to server' });
        }

        this.socket.emit('login', { username, password }, (response) => {
            if (response.success) {
                this.currentUser = response.user;
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            }
            callback(response);
        });
    }

    // Get patients
    getPatients(callback) {
        if (!this.isConnected) {
            return callback({ success: false, message: 'Not connected to server' });
        }

        this.socket.emit('getPatients', callback);
    }

    // Register patient
    registerPatient(patientData, callback) {
        if (!this.isConnected) {
            return callback({ success: false, message: 'Not connected to server' });
        }

        // Use HTTP API for patient registration
        fetch('/api/reception/register-patient', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(patientData)
        })
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => callback({ success: false, message: 'Network error' }));
    }

    // Get today's patients
    getTodayPatients(callback) {
        if (!this.isConnected) {
            return callback({ success: false, message: 'Not connected to server' });
        }

        // Use HTTP API for today's patients
        fetch('/api/reception/today-patients')
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => callback({ success: false, message: 'Network error' }));
    }

    // Search patients
    searchPatients(query, callback) {
        if (!this.isConnected) {
            return callback({ success: false, message: 'Not connected to server' });
        }

        // Use HTTP API for patient search
        fetch(`/api/reception/search-patients?query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => callback({ success: false, message: 'Network error' }));
    }

    // Get patient details
    getPatientDetails(patientId, callback) {
        if (!this.isConnected) {
            return callback({ success: false, message: 'Not connected to server' });
        }

        // Use HTTP API for patient details
        fetch(`/api/reception/patient/${patientId}`)
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => callback({ success: false, message: 'Network error' }));
    }

    // View a specific record
    viewRecord(recordId, callback) {
        if (!this.isConnected) {
            return callback({ success: false, message: 'Not connected to server' });
        }

        this.socket.emit('viewRecord', recordId, callback);
    }

    // Add a new record (Doctor only)
    addRecord(data, callback) {
        if (!this.isConnected) {
            return callback({ success: false, message: 'Not connected to server' });
        }

        this.socket.emit('addRecord', data, callback);
    }

    // Admin workflow methods
    getPendingRegistrations(callback) {
        if (!this.isConnected) {
            return callback({ success: false, message: 'Not connected to server' });
        }
        this.socket.emit('getPendingRegistrations', {}, callback);
    }

    approveRegistration(registrationId, callback) {
        if (!this.isConnected) {
            return callback({ success: false, message: 'Not connected to server' });
        }
        this.socket.emit('approveRegistration', { registrationId }, callback);
    }

    rejectRegistration(registrationId, reason, callback) {
        if (!this.isConnected) {
            return callback({ success: false, message: 'Not connected to server' });
        }
        this.socket.emit('rejectRegistration', { registrationId, reason }, callback);
    }

    getAllUsers(callback) {
        if (!this.isConnected) {
            return callback({ success: false, message: 'Not connected to server' });
        }
        this.socket.emit('getAllUsers', {}, callback);
    }

    getAllOrganizations(callback) {
        if (!this.isConnected) {
            return callback({ success: false, message: 'Not connected to server' });
        }
        this.socket.emit('getAllOrganizations', {}, callback);
    }

    approveOrganization(orgId, callback) {
        if (!this.isConnected) {
            return callback({ success: false, message: 'Not connected to server' });
        }
        this.socket.emit('approveOrganization', { orgId }, callback);
    }

    getSystemStats(callback) {
        if (!this.isConnected) {
            return callback({ success: false, message: 'Not connected to server' });
        }
        this.socket.emit('getSystemStats', {}, callback);
    }

    // Forgot password request
    forgotPassword(email, callback) {
        if (!this.isConnected) {
            return callback({ success: false, message: 'Not connected to server' });
        }
        this.socket.emit('forgotPassword', { email }, callback);
    }

    // Submit registration request
    submitRegistration(data, callback) {
        if (!this.isConnected) {
            return callback({ success: false, message: 'Not connected to server' });
        }
        this.socket.emit('submitRegistration', data, callback);
    }

    // Logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        if (this.socket) {
            this.socket.disconnect();
        }
        // For desktop app, redirect to root instead of index.html
        window.location.href = '/';
    }

    // Check if user is logged in
    isLoggedIn() {
        if (this.currentUser) {
            return true;
        }

        const stored = localStorage.getItem('currentUser');
        if (stored) {
            try {
                this.currentUser = JSON.parse(stored);
                return true;
            } catch (e) {
                localStorage.removeItem('currentUser');
            }
        }
        return false;
    }

    // Get current user role
    getUserRole() {
        return this.currentUser ? this.currentUser.role : null;
    }

    // Reset password
    resetPassword(token, newPassword, callback) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('resetPassword', { token, newPassword }, callback);
        } else {
            callback({ success: false, message: 'Not connected to server' });
        }
    }

    // Handle incoming notifications
    onNotification(notification) {
        console.log('Received notification:', notification);

        // Show notification to user
        if (typeof showNotification === 'function') {
            showNotification(notification.message, 'info');
        } else {
            // Trigger custom event for specific handling
            const event = new CustomEvent('newNotification', {
                detail: notification
            });
            document.dispatchEvent(event);
        }
    }

    onConnect() {
        console.log('Default onConnect handler');
    }

    onDisconnect() {
        console.log('Default onDisconnect handler');
    }

    onConnectionError(error) {
        console.error('Default onConnectionError handler:', error);
    }
}

// Global client instance
const medClient = new MedicalRecordsClient();
