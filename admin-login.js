// Admin login script: submit to server-side login.php

// Show server-side login error if provided in query string
(function(){
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('admin-login-form');
        const errorMessage = document.getElementById('error-message');

        // Display server-provided error param if present
        try {
            const params = new URLSearchParams(window.location.search);
            const err = params.get('error');
            if (err) {
                errorMessage.textContent = decodeURIComponent(err);
                errorMessage.classList.add('show');
            }
        } catch(e) {}

        // Basic client-side validation on submit
        form.addEventListener('submit', function(e) {
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            if (!username || !password) {
                e.preventDefault();
                errorMessage.textContent = 'Please enter both username and password.';
                errorMessage.classList.add('show');
                setTimeout(() => errorMessage.classList.remove('show'), 3000);
                return false;
            }

            // Persist 'remember me' selection locally to help UX only (server decides session cookie)
            if (document.getElementById('remember').checked) localStorage.setItem('adminRemember', 'true');
            else localStorage.removeItem('adminRemember');

            // Allow form to submit to server (login.php) - server will redirect on success
            return true;
        });

        // If admin session is already present in sessionStorage (set by server-side pages), redirect
        if (sessionStorage.getItem('adminLoggedIn') === 'true') {
            window.location.href = 'admin-dashboard.html';
        }
    });
})();
