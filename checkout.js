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

// Function to handle editing custom items
function editCustomItem(itemId) {
    // Store current item details before editing
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const itemToEdit = cartItems.find(item => item.id === itemId);
    
    if (itemToEdit) {
        // Make sure we have all the necessary properties
        const itemForEdit = {
            ...itemToEdit,
            design: itemToEdit.design || {
                image: itemToEdit.customImage || '',
                position: { x: 0, y: 0 },
                size: { width: '100px', height: '100px' }
            }
        };
        
        // Store the item being edited and its index
        localStorage.setItem('editingCustomItem', JSON.stringify({
            item: itemForEdit,
            index: cartItems.indexOf(itemToEdit)
        }));
        
        // Redirect to customize page
        window.location.href = 'customize.html?mode=edit&id=' + encodeURIComponent(itemId);
    }
}

function updatePaymentOptions() {
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked').value;
    const codOption = document.getElementById('cod-option');
    const cashOption = document.getElementById('cash-option');
    const gcashOption = document.getElementById('gcash-option');
    const gcashDetails = document.getElementById('gcash-details');
    
    // Reset GCash details visibility
    gcashDetails.style.display = 'none';
    
    if (deliveryMethod === 'delivery') {
        codOption.style.display = 'block';
        cashOption.style.display = 'none';
        document.getElementById('cod').checked = true;
    } else if (deliveryMethod === 'pickup') {
        codOption.style.display = 'none';
        cashOption.style.display = 'block';
        document.getElementById('cash').checked = true;
    }

    // Show GCash details if GCash is selected
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    if (paymentMethod === 'gcash') {
        gcashDetails.style.display = 'block';
    }
}

// Validate GCash number
function validateGCashNumber(number) {
    return /^09\d{9}$/.test(number); // Validates format: 09XXXXXXXXX
}

// Validate order before submission
function validateOrder() {
    // Get all required form fields
    const requiredFields = document.querySelectorAll('input[required]');
    for (let field of requiredFields) {
        if (!field.value) {
            alert('Please fill in all required fields');
            field.focus();
            return false;
        }
    }

    // Payment method specific validation
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    if (paymentMethod === 'gcash') {
        const gcashNumber = document.getElementById('gcash-number').value;
        if (!validateGCashNumber(gcashNumber)) {
            alert('Please enter a valid GCash number (format: 09XXXXXXXXX)');
            document.getElementById('gcash-number').focus();
            return false;
        }
    }

    return true;
}

document.addEventListener('DOMContentLoaded', function() {
    // Delivery method change handler
    const deliveryOptions = document.querySelectorAll('input[name="deliveryMethod"]');
    deliveryOptions.forEach(option => {
        option.addEventListener('change', updatePaymentOptions);
    });

    // Payment method change handler
    const paymentOptions = document.querySelectorAll('input[name="paymentMethod"]');
    paymentOptions.forEach(option => {
        option.addEventListener('change', updatePaymentOptions);
    });

    // Place order button handler
    const placeOrderBtn = document.querySelector('.place-order-btn');
    placeOrderBtn.addEventListener('click', function() {
        if (validateOrder()) {
            // TODO: Handle order submission
            alert('Order placed successfully!');
        }
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

// --- Checkout rendering & total calculation ---
document.addEventListener('DOMContentLoaded', function() {
    const checkoutItemsEl = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const totalEl = document.getElementById('total');

    function formatCurrency(num){
        if (isNaN(num) || num == null) num = 0;
        return '₱' + Number(num).toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2});
    }

    function getCartItems(){
        try { return JSON.parse(localStorage.getItem('cartItems') || '[]'); } catch(e){ return []; }
    }

    // simple price lookup for legacy items without a price field
    const priceLookup = {
        'souvenirs': 150,
        'giveaways': 100,
        'bulk packages': 1000,
        'custom signage': 500,
        'banners': 500,
        'stickers & decals': 300,
        'custom mugs': 250,
        't-shirt printing': 350,
        'keychains': 80,
        'invitations': 150,
        'calling cards': 200
    };

    function resolveUnitPrice(item){
        if (item.price != null && !isNaN(Number(item.price))) return Number(item.price);
        const key = (item.id || item.name || '').toString().toLowerCase();
        if (priceLookup[key]) return priceLookup[key];
        // fallback: try to extract digits from item.name
        const m = (item.name || '').replace(/,/g,'').match(/(\d+(?:\.\d+)?)/);
        if (m) return Number(m[1]);
        console.warn('No unit price found for cart item', item);
        return 0;
    }

    function renderCheckout(){
        const items = getCartItems();
        checkoutItemsEl.innerHTML = '';
        if (!items.length){
            checkoutItemsEl.innerHTML = '<p style="color:rgba(255,255,255,0.8);">Your cart is empty.</p>';
            subtotalEl.textContent = formatCurrency(0);
            shippingEl.textContent = formatCurrency(0);
            totalEl.textContent = formatCurrency(0);
            return;
        }

        let subtotal = 0;
        items.forEach(it => {
            const unit = resolveUnitPrice(it);
            const qty = parseInt(it.qty,10) || 0;
            const line = unit * qty;
            subtotal += line;
            const el = document.createElement('div');
            el.className = 'checkout-item';
            el.style.display = 'flex';
            el.style.justifyContent = 'space-between';
            el.style.alignItems = 'center';
            el.style.marginBottom = '0.75rem';
            el.innerHTML = `
                <div style="display:flex;flex-direction:column;">
                    <strong style="color:#ffd700">${it.name}</strong>
                    <small style="color:rgba(255,255,255,0.8)">${it.size? 'Size: '+it.size + (it.color? ' • Color: '+it.color : '') : (it.color? 'Color: '+it.color : '')}</small>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="text-align:right">
                        <div>${formatCurrency(unit)} x ${qty}</div>
                        <div style="font-weight:600;color:#fff;margin-top:4px">${formatCurrency(line)}</div>
                    </div>
                    ${it.isCustom ? `
                    <button class="edit-custom-btn" onclick="editCustomItem('${it.id}')" style="background:#FFD700;color:#28263A;border:none;border-radius:4px;padding:4px 8px;cursor:pointer;transition:all 0.3s ease;font-weight:500;text-shadow:none;">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    ` : ''}
                </div>`;
            checkoutItemsEl.appendChild(el);
        });

        // shipping rules: free for subtotal >= 500, otherwise 50
        const shipping = (subtotal > 0 && subtotal < 500) ? 50 : 0;
        const total = subtotal + shipping;

        subtotalEl.textContent = formatCurrency(subtotal);
        shippingEl.textContent = formatCurrency(shipping);
        totalEl.textContent = formatCurrency(total);
    }

    // listen for cart updates from other pages
    window.addEventListener('cart:updated', renderCheckout);
    // initial render
    renderCheckout();
});

// Get DOM elements
const deliveryMethodInputs = document.getElementsByName('deliveryMethod');
const paymentMethodInputs = document.getElementsByName('paymentMethod');
const codOption = document.getElementById('cod-option');
const cashOption = document.getElementById('cash-option');
const gcashOption = document.getElementById('gcash-option');
const gcashDetails = document.getElementById('gcash-details');

// Handle delivery method change
deliveryMethodInputs.forEach(input => {
    input.addEventListener('change', (e) => {
        const isDelivery = e.target.value === 'delivery';
        
        // Show/hide payment options based on delivery method
        codOption.style.display = isDelivery ? 'block' : 'none';
        cashOption.style.display = isDelivery ? 'none' : 'block';
        
        // Reset payment selection
        if (isDelivery) {
            document.getElementById('cod').checked = true;
        } else {
            document.getElementById('cash').checked = true;
        }
    });
});

// Handle payment method change
paymentMethodInputs.forEach(input => {
    input.addEventListener('change', (e) => {
        // Show/hide GCash details
        gcashDetails.style.display = e.target.value === 'gcash' ? 'block' : 'none';
        
        // Clear GCash number when switching payment methods
        if (e.target.value !== 'gcash') {
            document.getElementById('gcash-number').value = '';
        }
    });
});

// Validate GCash number
const gcashNumberInput = document.getElementById('gcash-number');
gcashNumberInput.addEventListener('input', (e) => {
    const value = e.target.value;
    if (value.length > 11) {
        e.target.value = value.slice(0, 11);
    }
    // Only allow numbers
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

document.addEventListener('DOMContentLoaded', function() {
    const deliveryRadios = document.getElementsByName('deliveryMethod');
    const codOption = document.getElementById('cod-option');
    const cashOption = document.getElementById('cash-option');
    const gcashOption = document.getElementById('gcash-option');

    function updatePaymentMethods() {
        const selectedDelivery = document.querySelector('input[name="deliveryMethod"]:checked').value;
        
        if (selectedDelivery === 'delivery') {
            codOption.style.display = 'block';
            cashOption.style.display = 'none';
            document.getElementById('cod').checked = true;
        } else {
            codOption.style.display = 'none';
            cashOption.style.display = 'block';
            document.getElementById('cash').checked = true;
        }
        
        // GCash is always visible
        gcashOption.style.display = 'block';
    }

    // Add event listeners to delivery method radio buttons
    deliveryRadios.forEach(radio => {
        radio.addEventListener('change', updatePaymentMethods);
    });

    // Initialize payment methods on page load
    updatePaymentMethods();
});