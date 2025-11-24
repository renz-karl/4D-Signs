document.getElementById('contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values (re-enable fields temporarily to get values)
    const nameField = document.getElementById('name');
    const emailField = document.getElementById('email');
    const phoneField = document.getElementById('phone');
    
    nameField.disabled = false;
    emailField.disabled = false;
    phoneField.disabled = false;
    
    const name = nameField.value.trim();
    const email = emailField.value.trim();
    const phone = phoneField.value.trim();
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value.trim();
    const saveInfo = document.getElementById('save-contact-info').checked;
    
    // Validate phone number
    if (!/^[0-9]{11}$/.test(phone)) {
        alert('Please enter a valid 11-digit phone number');
        return;
    }
    
    // Save contact info if checkbox is checked
    if (saveInfo) {
        const contactInfo = {
            name: name,
            email: email,
            phone: phone
        };
        localStorage.setItem('savedContactInfo', JSON.stringify(contactInfo));
    }
    
    // Create message object
    const contactMessage = {
        messageId: 'MSG-' + Date.now(),
        name: name,
        email: email,
        phone: phone,
        subject: subject,
        message: message,
        status: 'Unread',
        reply: null,
        createdDate: new Date().toISOString(),
        createdDateFormatted: new Date().toLocaleString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    
    // Save to localStorage
    const messages = JSON.parse(localStorage.getItem('contactMessages')) || [];
    messages.push(contactMessage);
    localStorage.setItem('contactMessages', JSON.stringify(messages));
    
    // Show success message
    alert('✅ Message sent successfully!\n\nThank you for contacting us. We will get back to you soon.');
    
    // Reset form and selector
    document.getElementById('contact-form').reset();
    const contactSelector = document.getElementById('contact-selector');
    if (contactSelector) {
        contactSelector.value = '';
    }
    nameField.disabled = false;
    emailField.disabled = false;
    phoneField.disabled = false;
});

// Load saved contact info on page load
window.addEventListener('DOMContentLoaded', function() {
    const savedInfo = localStorage.getItem('savedContactInfo');
    const savedInfoSection = document.getElementById('saved-info-section');
    const contactSelector = document.getElementById('contact-selector');
    
    if (savedInfo) {
        // Show the saved info selector
        savedInfoSection.style.display = 'block';
        
        // Handle selector change
        contactSelector.addEventListener('change', function() {
            const nameField = document.getElementById('name');
            const emailField = document.getElementById('email');
            const phoneField = document.getElementById('phone');
            
            if (this.value === 'saved') {
                // Use saved information
                const info = JSON.parse(savedInfo);
                nameField.value = info.name || '';
                emailField.value = info.email || '';
                phoneField.value = info.phone || '';
                
                // Disable fields
                nameField.disabled = true;
                emailField.disabled = true;
                phoneField.disabled = true;
                
                // Auto-check save checkbox
                document.getElementById('save-contact-info').checked = true;
            } else if (this.value === 'new') {
                // Enter new information
                nameField.value = '';
                emailField.value = '';
                phoneField.value = '';
                
                // Enable fields
                nameField.disabled = false;
                emailField.disabled = false;
                phoneField.disabled = false;
                
                // Uncheck save checkbox
                document.getElementById('save-contact-info').checked = false;
            } else {
                // No selection - clear and enable fields
                nameField.value = '';
                emailField.value = '';
                phoneField.value = '';
                nameField.disabled = false;
                emailField.disabled = false;
                phoneField.disabled = false;
            }
        });
    }
});

// Phone number validation on input
document.getElementById('phone').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^0-9]/g, '').substring(0, 11);
});
