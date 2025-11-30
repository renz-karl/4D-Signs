document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        validateForm();
    });

    function validateForm() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        let valid = true;

        if (username === '') {
            valid = false;
            alert('Username is required.');
        }

        if (password === '') {
            valid = false;
            alert('Password is required.');
        }

        if (valid) {
            authenticateUser(username, password);
        }
    }

    function authenticateUser(username, password) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => (u.username === username || u.email === username) && u.password === password);

        if (user) {
            // Store logged in user info
            const loggedInUser = {
                id: user.id,
                username: user.username,
                email: user.email,
                loggedInAt: new Date().toISOString()
            };
            localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));

            console.log('Login successful for:', user.username);
            window.location.href = '4Dsigns.html';
        } else {
            alert('Invalid username/email or password. Please try again.');
        }
    }
});