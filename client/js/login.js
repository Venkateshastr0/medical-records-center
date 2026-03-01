// Login page functionality
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginSpinner = document.getElementById('loginSpinner');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');

    // Registration modal elements
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const requestAccessBtn = document.getElementById('requestAccessBtn');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const registrationModal = document.getElementById('registrationModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeForgotModalBtn = document.getElementById('closeForgotModalBtn');
    const registrationForm = document.getElementById('registrationForm');
    const cancelRegBtn = document.getElementById('cancelRegBtn');
    const submitRegBtn = document.getElementById('submitRegBtn');
    const submitRegBtnText = document.getElementById('submitRegBtnText');
    const submitRegSpinner = document.getElementById('submitRegSpinner');

    // Forgot password modal elements
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const cancelForgotBtn = document.getElementById('cancelForgotBtn');
    const submitForgotBtn = document.getElementById('submitForgotBtn');
    const submitForgotBtnText = document.getElementById('submitForgotBtnText');
    const submitForgotSpinner = document.getElementById('submitForgotSpinner');

    // Connect to server
    medClient.connect();

    // Modal event listeners
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', () => {
            console.log('Forgot password clicked');
            forgotPasswordModal.classList.remove('hidden');
        });
    }

    if (requestAccessBtn) {
        requestAccessBtn.addEventListener('click', () => {
            console.log('Request access clicked');
            registrationModal.classList.remove('hidden');
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            console.log('Close modal clicked');
            registrationModal.classList.add('hidden');
        });
    }

    if (closeForgotModalBtn) {
        closeForgotModalBtn.addEventListener('click', () => {
            console.log('Close forgot modal clicked');
            forgotPasswordModal.classList.add('hidden');
        });
    }

    if (cancelRegBtn) {
        cancelRegBtn.addEventListener('click', () => {
            console.log('Cancel reg clicked');
            registrationModal.classList.add('hidden');
        });
    }

    if (cancelForgotBtn) {
        cancelForgotBtn.addEventListener('click', () => {
            console.log('Cancel forgot clicked');
            forgotPasswordModal.classList.add('hidden');
        });
    }

    // Forgot password form submission
    forgotPasswordForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Show loading state
        submitForgotBtn.disabled = true;
        submitForgotBtnText.textContent = 'Sending...';
        submitForgotSpinner.classList.remove('hidden');

        const email = document.getElementById('forgotEmail').value;

        try {
            // Submit forgot password request
            medClient.forgotPassword(email, (response) => {
                submitForgotBtn.disabled = false;
                submitForgotBtnText.textContent = 'Send Reset Link';
                submitForgotSpinner.classList.add('hidden');

                if (response.success) {
                    forgotPasswordModal.classList.add('hidden');
                    showNotification('Password reset instructions sent to your email', 'success');
                    forgotPasswordForm.reset();
                } else {
                    showNotification(response.message || 'Failed to send reset link', 'error');
                }
            });
        } catch (error) {
            submitForgotBtn.disabled = false;
            submitForgotBtnText.textContent = 'Send Reset Link';
            submitForgotSpinner.classList.add('hidden');
            showNotification('An error occurred. Please try again.', 'error');
        }
    });

    // Registration form submission
    registrationForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Show loading state
        submitRegBtn.disabled = true;
        submitRegBtnText.textContent = 'Submitting...';
        submitRegSpinner.classList.remove('hidden');

        // Get form data
        const formData = new FormData(registrationForm);
        const data = Object.fromEntries(formData);

        try {
            // Submit registration
            medClient.submitRegistration(data, (response) => {
                submitRegBtn.disabled = false;
                submitRegBtnText.textContent = 'Submit Request';
                submitRegSpinner.classList.add('hidden');

                if (response.success) {
                    registrationModal.classList.add('hidden');
                    showSuccessModal();
                    registrationForm.reset();
                } else {
                    showNotification(response.message || 'Registration failed', 'error');
                }
            });
        } catch (error) {
            submitRegBtn.disabled = false;
            submitRegBtnText.textContent = 'Submit Request';
            submitRegSpinner.classList.add('hidden');
            showNotification('An error occurred. Please try again.', 'error');
        }
    });

    // Override connection handlers
    medClient.onConnect = function () {
        console.log('Connected to Medical Records Server');
        // Check if user is already logged in
        if (medClient.isLoggedIn()) {
            redirectToDashboard(medClient.getUserRole());
        }
    };

    medClient.onConnectionError = function (error) {
        showNotification('Failed to connect to server. Please try again.', 'error');
        setLoginButtonLoading(false);
    };

    // Handle form submission
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        console.log('🔍 Login form submitted'); // Debug log

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        console.log('📝 Form data:', { username, password: password ? '***' : 'empty' }); // Debug log

        if (!username || !password) {
            showNotification('Please enter both username and password', 'warning');
            return;
        }

        console.log('🚀 Starting login process...'); // Debug log
        setLoginButtonLoading(true);

        // Attempt login
        medClient.login(username, password, function (response) {
            console.log('📡 Login response received:', response); // Debug log
            setLoginButtonLoading(false);

            if (response.success) {
                console.log('✅ Login successful:', response.user);
                showNotification(`Welcome back, ${response.user.name}!`, 'success');
                // Store user session
                medClient.currentUser = response.user;
                localStorage.setItem('currentUser', JSON.stringify(response.user));

                // Redirect based on role
                console.log('✅ Login successful:', response.user);

                // Redirect based on role with slight delay
                setTimeout(() => {
                    redirectToDashboard(response.user.role);
                }, 100);
            } else {
                console.log('❌ Login failed:', response.message);
                showNotification(response.message || 'Login failed. Please try again.', 'error');
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    });

    // Helper function to set login button loading state
    function setLoginButtonLoading(loading) {
        if (loading) {
            loginBtn.disabled = true;
            loginBtnText.textContent = 'Authenticating...';
            loginSpinner.classList.remove('hidden');
        } else {
            loginBtn.disabled = false;
            loginBtnText.textContent = 'Authenticate';
            loginSpinner.classList.add('hidden');
        }
    }

    // Check for remembered device
    if (localStorage.getItem('rememberDevice') === 'true') {
        rememberCheckbox.checked = true;
    }

    // Add enter key support for form fields
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    });

    // Demo credentials removed for security
    console.log('Authentication system initialized');

    // Redirect to dashboard based on user role
    function redirectToDashboard(role) {
        const rolePages = {
            'Admin': 'pages/admin-dashboard.html',
            'Developer': 'pages/developer-dashboard.html',
            'Doctor': 'pages/doctor-dashboard.html',
            'Insurance': 'pages/insurance-dashboard.html',
            'Lawyer': 'pages/lawyer-dashboard.html',
            'Team Lead': 'pages/team-lead-dashboard.html',
            'Hospital Reception': 'pages/reception-dashboard.html'
        };

        const dashboardPage = rolePages[role] || 'pages/dashboard.html';
        console.log('🔄 Redirecting to:', dashboardPage); // Debug log
        window.location.href = dashboardPage;
    }

    // Forgot password modal functionality
    forgotPasswordLink.addEventListener('click', function () {
        forgotPasswordModal.classList.remove('hidden');
    });

    closeForgotModalBtn.addEventListener('click', function () {
        forgotPasswordModal.classList.add('hidden');
    });

    forgotPasswordForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = document.getElementById('forgotEmail').value;

        if (!email) {
            alert('Please enter your email address');
            return;
        }

        setForgotButtonLoading(true);

        medClient.forgotPassword(email, function (response) {
            setForgotButtonLoading(false);

            if (response.success) {
                alert(response.message);
                forgotPasswordModal.classList.add('hidden');

                // In development, show the token for testing
                if (response.resetToken) {
                    alert(`Development reset token: ${response.resetToken}`);
                }
            } else {
                alert('Error: ' + response.message);
            }
        });
    });

    // Helper function to set forgot button loading state
    function setForgotButtonLoading(loading) {
        if (loading) {
            submitForgotBtn.disabled = true;
            submitForgotBtnText.textContent = 'Sending...';
            submitForgotSpinner.classList.remove('hidden');
        } else {
            submitForgotBtn.disabled = false;
            submitForgotBtnText.textContent = 'Send Reset Link';
            submitForgotSpinner.classList.add('hidden');
        }
    }
});
