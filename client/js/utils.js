// Utility functions for Medical Records Center
5
// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'warning' ? 'bg-yellow-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="material-symbols-outlined">
                ${type === 'success' ? 'check_circle' :
                  type === 'error' ? 'error' :
                  type === 'warning' ? 'warning' :
                  'info'}
            </span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show loading state
function showLoading(element, text = 'Loading...') {
    element.innerHTML = `
        <div class="flex items-center justify-center p-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span class="ml-2">${text}</span>
        </div>
    `;
}

// Hide loading state
function hideLoading(element, content) {
    element.innerHTML = content;
}

// Validate form
function validateForm(formData) {
    const errors = [];
    
    for (const [key, value] of Object.entries(formData)) {
        if (!value || value.trim() === '') {
            errors.push(`${key} is required`);
        }
    }
    
    return errors;
}

// Get role-based color
function getRoleColor(role) {
    switch (role) {
        case 'Doctor': return 'bg-blue-100 text-blue-800';
        case 'Admin': return 'bg-purple-100 text-purple-800';
        case 'Insurance': return 'bg-green-100 text-green-800';
        case 'Lawyer': return 'bg-orange-100 text-orange-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Get status color
function getStatusColor(status) {
    switch (status) {
        case 'Active': return 'bg-green-100 text-green-800';
        case 'Under Review': return 'bg-yellow-100 text-yellow-800';
        case 'Inactive': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Redirect based on role
function redirectToDashboard(role) {
    // For desktop app, use absolute paths from root
    const dashboards = {
        'Admin': '/pages/admin-dashboard.html',
        'Doctor': '/pages/doctor-dashboard.html',
        'Insurance': '/pages/insurance-dashboard.html',
        'Lawyer': '/pages/lawyer-dashboard.html',
        'TeamLead': '/pages/team-lead-dashboard.html',
        'Developer': '/pages/developer-dashboard.html'
    };
    
    const dashboard = dashboards[role];
    if (dashboard) {
        window.location.href = dashboard;
    } else {
        showNotification('Invalid role', 'error');
    }
}

// Add messenger navigation
function addMessengerLink() {
    const header = document.querySelector('header .container');
    if (header) {
        const messengerLink = document.createElement('a');
        messengerLink.href = '/pages/messenger.html';
        messengerLink.className = 'px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2';
        messengerLink.innerHTML = `
            <span class="material-symbols-outlined text-lg">chat</span>
            Messages
        `;
        header.appendChild(messengerLink);
    }
}

// Auto-add messenger link on all dashboards
document.addEventListener('DOMContentLoaded', function() {
    // Only add if not on login or messenger page
    if (!window.location.pathname.includes('index.html') && 
        !window.location.pathname.includes('messenger.html')) {
        setTimeout(addMessengerLink, 100);
    }
});

// Check authentication and redirect if needed
function requireAuth() {
    if (!medClient.isLoggedIn()) {
        showNotification('Please login to access this page', 'warning');
        setTimeout(() => {
            // For desktop app, redirect to root instead of ../index.html
            window.location.href = '/';
        }, 1500);
        return false;
    }
    return true;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
