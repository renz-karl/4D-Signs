document.getElementById('contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value.trim();
    
    // Validate phone number
    if (!/^[0-9]{11}$/.test(phone)) {
        alert('Please enter a valid 11-digit phone number');
        return;
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
    
    // Reset form
    document.getElementById('contact-form').reset();
});

// Phone number validation on input
document.getElementById('phone').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^0-9]/g, '').substring(0, 11);
});
