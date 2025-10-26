document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        validateForm();
    });

    function validateForm() {
        const username = document.getElementById('username').value;
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
            submitForm(username, password);
        }
    }

    function submitForm(username, password) {
        
        console.log('Form submitted with:', { username, password });
        
        try {
            localStorage.setItem('loggedInUser', JSON.stringify({ username, loggedInAt: Date.now() }));
        } catch (e) {}
        window.location.href = '4Dsigns.html';
    }
});