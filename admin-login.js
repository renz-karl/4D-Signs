// Single admin account credentials
const ADMIN_ACCOUNT = {
    username: 'admin',
    password: 'admin123'
};

document.getElementById('admin-login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    const errorMessage = document.getElementById('error-message');
    
    // Validate credentials
    if (username === ADMIN_ACCOUNT.username && password === ADMIN_ACCOUNT.password) {
        // Store admin session
        sessionStorage.setItem('adminLoggedIn', 'true');
        sessionStorage.setItem('adminUsername', username);
        
        if (remember) {
            localStorage.setItem('adminRemember', 'true');
        }
        
        // Redirect to admin dashboard
    window.location.href = 'admin-dashboard.html';
    } else {
        // Show error message
        errorMessage.textContent = 'Invalid username or password';
        errorMessage.classList.add('show');
        
        // Clear error after 3 seconds
        setTimeout(() => {
            errorMessage.classList.remove('show');
        }, 3000);
    }
});

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        window.location.href = 'admin-dashboard.html';
    }
});
