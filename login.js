document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', function(event) {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        if (!username) { event.preventDefault(); alert('Username is required.'); return; }
        if (!password) { event.preventDefault(); alert('Password is required.'); return; }
        // Allow normal form POST to server so server can handle redirects and verification checks.
    });
});