function togglePopup(element, event) {
    event.stopPropagation();
    const popup = element.querySelector('.address-popup');
    popup.classList.toggle('show');
}

function validatePhoneNumber(phone) {
    const phoneRegex = /^[0-9]{11}$/;
    return phoneRegex.test(phone);
}


function saveAddress(button, event) {
    event.stopPropagation();
    const popup = button.closest('.address-popup');
    const form = popup.querySelector('form');
    const phoneInput = form.querySelector('input[type="tel"]');
    
    if (phoneInput.value && !validatePhoneNumber(phoneInput.value)) {
        alert('Please enter a valid 11-digit phone number');
        return;
    }
    
    
    const street = form.querySelector('input[name="street"]').value;
    const phone = form.querySelector('input[name="phone"]').value;
    const city = form.querySelector('input[name="city"]').value;
    const province = form.querySelector('input[name="province"]').value;
    const zipCode = form.querySelector('input[name="zipCode"]').value;
    
    
    const formattedAddress = `${street}, ${city}, ${province} ${zipCode}\nPhone: ${phone}`;
    
    
    const addressDisplay = document.getElementById('address-display');
    addressDisplay.textContent = formattedAddress;
    
    
    addressDisplay.style.color = '#333';
    addressDisplay.style.fontSize = '14px';
    
    popup.classList.remove('show');
}

function toggleMessagePopup(event) {
    event.stopPropagation(); 
    const popup = document.getElementById('messagePopup');
    popup.classList.toggle('show');
}

function updatePaymentOptions() {
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked').value;
    const codOption = document.getElementById('cod-option');
    const cashOption = document.getElementById('cash-option');
    const gcashOption = document.getElementById('gcash-option');
    
    if (deliveryMethod === 'delivery') {
        codOption.style.display = 'block';
        cashOption.style.display = 'none';
        document.getElementById('cod').checked = true;
    } else if (deliveryMethod === 'pickup') {
        codOption.style.display = 'none';
        cashOption.style.display = 'block';
        document.getElementById('cash').checked = true;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const deliveryOptions = document.querySelectorAll('input[name="deliveryMethod"]');
    deliveryOptions.forEach(option => {
        option.addEventListener('change', updatePaymentOptions);
    });
    
    updatePaymentOptions();
});

function closeMessagePopup() {
    const popup = document.getElementById('messagePopup');
    popup.classList.remove('show');
}

function saveMessage(event) {
    event.stopPropagation(); 
    const popup = document.getElementById('messagePopup');
    const message = popup.querySelector('textarea').value;
    console.log('Message saved:', message);
    closeMessagePopup();
}

function togglePaymentMethods(event) {
    event.stopPropagation();
    const options = document.getElementById('paymentOptions');
    options.classList.toggle('show');
}

function selectPayment(method, event) {
    event.stopPropagation();
    document.getElementById('selected-payment').textContent = method;
    document.getElementById('paymentOptions').classList.remove('show');
}

function updatePaymentOptions() {
    const isPickup = document.getElementById('pickup').checked;
    const paymentOptions = document.getElementById('paymentOptions');
    const codOption = paymentOptions.querySelector('.payment-option:first-child');
    
    if (isPickup) {
        codOption.innerHTML = `
            <i class="fas fa-money-bill"></i>
            <span>Cash</span>
        `;
        codOption.onclick = (event) => selectPayment('Cash', event);
    } else {
        codOption.innerHTML = `
            <i class="fas fa-money-bill"></i>
            <span>Cash on Delivery (COD)</span>
        `;
        codOption.onclick = (event) => selectPayment('Cash on Delivery (COD)', event);
    }
    
    document.getElementById('selected-payment').textContent = 'Select Payment Method';
}


document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(event) {
        const addressBar = event.target.closest('.address-bar');
        const addressPopup = event.target.closest('.address-popup');
        
        if (!addressBar && !addressPopup) {
            const popups = document.querySelectorAll('.address-popup');
            popups.forEach(popup => popup.classList.remove('show'));
        }

        const popup = document.getElementById('messagePopup');
        const leaveMessage = document.querySelector('.leave-message');
        
        if (!popup.contains(event.target) && !leaveMessage.contains(event.target)) {
            closeMessagePopup();
        }

        const paymentMethod = event.target.closest('.payment-method');
        const paymentOptions = document.getElementById('paymentOptions');
        
        if (!paymentMethod && paymentOptions.classList.contains('show')) {
            paymentOptions.classList.remove('show');
        }
    });

    document.querySelectorAll('input[name="deliveryMethod"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const addressBar = document.querySelector('.address-bar');
            if (this.value === 'pickup') {
                addressBar.style.display = 'none';
            } else {
                addressBar.style.display = 'flex';
            }
            updatePaymentOptions();
        });
    });
});