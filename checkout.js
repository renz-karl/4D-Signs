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
    const paymentMethod1 = document.querySelector('input[name="paymentMethod"]:checked').value;
    const downpaymentRow1 = document.getElementById('downpayment-row');
    const gcashDownSection = document.getElementById('gcash-downpayment-section');
    if (paymentMethod1 === 'gcash') {
        gcashDetails.style.display = 'block';
        downpaymentRow1.style.display = 'flex';
        gcashDownSection.style.display = 'block';
    } else {
        gcashDetails.style.display = 'none';
        downpaymentRow1.style.display = 'none';
        gcashDownSection.style.display = 'none';
    }
    // Calculate and show downpayment if GCash is selected
    const paymentMethod2 = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    const downpaymentRow2 = document.getElementById('downpayment-row');
    const downpaymentSpan = document.getElementById('downpayment');
    const total = parseFloat(document.getElementById('total').textContent.replace('₱','').replace(/,/g,'')) || 0;
    if (paymentMethod2 === 'gcash') {
        const down = Math.round(total * 0.3);
        downpaymentSpan.textContent = `₱${down.toLocaleString('en-PH', {minimumFractionDigits:2})}`;
        downpaymentRow2.style.display = 'flex';
    } else {
        downpaymentRow2.style.display = 'none';
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
        // If GCash, require reference number
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        if (paymentMethod === 'gcash') {
            const ref = document.getElementById('gcash-ref').value.trim();
            if (!ref) {
                alert('Please enter your GCash reference number for downpayment.');
                document.getElementById('gcash-ref').focus();
                return;
            }
        }
        if (validateOrder()) {
            placeOrder();
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

    function getCheckoutItems(){
        // First check if there are selected items from cart
        try {
            const checkoutItems = localStorage.getItem('checkoutItems');
            if (checkoutItems) {
                return JSON.parse(checkoutItems);
            }
        } catch(e) {
            console.error('Error loading checkout items:', e);
        }
        
        // Fallback to all cart items
        try { 
            return JSON.parse(localStorage.getItem('cartItems') || '[]'); 
        } catch(e){ 
            return []; 
        }
    }

    function resolveUnitPrice(item){
        // If cart item already carries a numeric price, use it (price captured at add-to-cart time)
        if (item.price != null && !isNaN(Number(item.price))) return Number(item.price);

        // Otherwise, try to find product in storage and derive a unit price (apply promo if active)
        try {
            const products = getProductsFromStorage();
            const prod = products.find(p => String(p.id) === String(item.id) || p.name === item.name);
            if (prod && prod.price) {
                // parse first numeric value from price string
                const match = String(prod.price).replace(/,/g,'').match(/(\d+(?:\.\d+)?)/);
                if (match) {
                    let unit = Number(match[1]);
                    try {
                        const promo = JSON.parse(localStorage.getItem('promo') || '{"active":false,"percent":30}');
                        if (promo && promo.active) {
                            unit = Math.round(unit * (1 - (promo.percent || 0)/100) * 100) / 100;
                        }
                    } catch(e) { /* ignore */ }
                    return unit;
                }
            }
        } catch(e) {
            console.warn('resolveUnitPrice: failed to derive price from products storage', e);
        }

        console.warn('No unit price found for item', item);
        return 25.00; // Default price
    }

    function renderCheckout(){
        const items = getCheckoutItems();
        checkoutItemsEl.innerHTML = '';
        
        if (!items.length){
            checkoutItemsEl.innerHTML = '<p style="color:rgba(255,255,255,0.8); text-align: center; padding: 2rem;">Your checkout is empty.</p>';
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
            
            // Get thumbnail image
            const img = it.designData?.images?.[0]?.src || it.image || 'BGDS.jpg';
            
            el.innerHTML = `
                <div class="checkout-item-image">
                    <img src="${img}" alt="${it.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 2px solid rgba(255, 215, 0, 0.3);">
                </div>
                <div class="checkout-item-details">
                    <div class="checkout-item-name">${it.name}</div>
                    <div class="checkout-item-meta">
                        ${it.size ? `Size: ${it.size}` : ''}
                        ${it.size && it.color ? ' • ' : ''}
                        ${it.color ? `Color: ${it.color}` : ''}
                        ${it.isCustom ? '<span class="custom-badge-small"><i class="fas fa-magic"></i> Custom</span>' : ''}
                    </div>
                    <div class="checkout-item-price">
                        ${formatCurrency(unit)} × ${qty}
                    </div>
                </div>
                <div class="checkout-item-total">
                    ${formatCurrency(line)}
                </div>
            `;
            checkoutItemsEl.appendChild(el);
        });

        // Calculate shipping
        const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked');
        const isDelivery = deliveryMethod && deliveryMethod.value === 'delivery';
        const shipping = (isDelivery && subtotal > 0 && subtotal < 500) ? 50 : 0;
        const total = subtotal + shipping;

        subtotalEl.textContent = formatCurrency(subtotal);
        shippingEl.textContent = formatCurrency(shipping);
        totalEl.textContent = formatCurrency(total);
    }

    // Update shipping when delivery method changes
    const deliveryInputs = document.querySelectorAll('input[name="deliveryMethod"]');
    deliveryInputs.forEach(input => {
        input.addEventListener('change', renderCheckout);
    });

    // Listen for cart updates from other pages
    window.addEventListener('cart:updated', renderCheckout);
    
    // Initial render
    renderCheckout();
    
    // ====== SAVED ADDRESS FUNCTIONALITY ======
    loadSavedAddresses();
    initializeAddressSelector();
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
});// Place order function

// --- Product stock helpers ---
function getProductsFromStorage() {
    try {
        return JSON.parse(localStorage.getItem('products') || '[]');
    } catch (e) {
        return [];
    }
}

function decrementStockForItems(items) {
    if (!items || !items.length) return;
    try {
        const products = getProductsFromStorage();
        let changed = false;
        items.forEach(item => {
            const qty = parseInt(item.quantity || item.qty || item.qty || 1, 10) || 1;
            // Find by id or name
            const idx = products.findIndex(p => String(p.id) === String(item.id) || p.name === item.name);
            if (idx !== -1) {
                const current = parseInt(products[idx].stock || 0, 10) || 0;
                const updated = Math.max(0, current - qty);
                if (updated !== current) {
                    products[idx].stock = updated;
                    changed = true;
                }
            }
        });
        if (changed) {
            localStorage.setItem('products', JSON.stringify(products));
            // Notify other parts of the app
            window.dispatchEvent(new CustomEvent('products:updated', { detail: { products } }));
        }
    } catch (e) {
        console.warn('decrementStockForItems failed', e);
    }
}

function placeOrder() {
    try {
        // Validate form fields
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        
        if (!name || !phone || !email) {
            alert('Please fill in all required fields (Name, Phone, Email)');
            return;
        }
        
        // Validate phone number
        if (!validatePhoneNumber(phone)) {
            alert('Please enter a valid 11-digit phone number');
            return;
        }
        
        // Get customer information
        const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked').value;
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        
        const customerInfo = {
            name: name,
            phone: phone,
            email: email,
            deliveryMethod: deliveryMethod,
            paymentMethod: paymentMethod
        };
        
        // Get address if delivery
        if (deliveryMethod === 'delivery') {
            const street = document.getElementById('street').value.trim();
            const barangay = document.getElementById('barangay').value.trim();
            const city = document.getElementById('city').value.trim();
            const province = document.getElementById('province').value.trim();
            const zipCode = document.getElementById('zipCode').value.trim();
            const landmark = document.getElementById('landmark').value.trim();
            
            if (!street || !barangay || !city || !province || !zipCode) {
                alert('Please complete all address fields for delivery');
                return;
            }
            
            customerInfo.address = {
                street: street,
                barangay: barangay,
                city: city,
                province: province,
                zipCode: zipCode,
                landmark: landmark
            };
            customerInfo.fullAddress = `${street}, ${barangay}, ${city}, ${province} ${zipCode}`;
            if (landmark) {
                customerInfo.fullAddress += ` (${landmark})`;
            }
        } else {
            customerInfo.fullAddress = 'Pick-up at store';
        }
        
        // Get GCash number if payment method is GCash
        if (paymentMethod === 'gcash') {
            const gcashNumber = document.getElementById('gcash-number').value.trim();
            if (!validateGCashNumber(gcashNumber)) {
                alert('Please enter a valid GCash number (format: 09XXXXXXXXX)');
                return;
            }
            customerInfo.gcashNumber = gcashNumber;
        }
        
        // Get checkout items
        const checkoutItems = JSON.parse(localStorage.getItem('checkoutItems') || '[]');
        
        if (checkoutItems.length === 0) {
            // Fallback to cart items if no checkout items
            const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
            if (cartItems.length === 0) {
                alert('Your cart is empty!');
                window.location.href = '4Dsigns.html';
                return;
            }
            checkoutItems.push(...cartItems);
        }
        
        // Calculate totals from displayed values
        const subtotalText = document.getElementById('subtotal').textContent;
        const shippingText = document.getElementById('shipping').textContent;
        const totalText = document.getElementById('total').textContent;
        
        const subtotal = parseFloat(subtotalText.replace('₱', '').replace(/,/g, '')) || 0;
        const shipping = parseFloat(shippingText.replace('₱', '').replace(/,/g, '')) || 0;
        const total = parseFloat(totalText.replace('₱', '').replace(/,/g, '')) || 0;
        
        // Get message to seller
        const messageTextarea = document.querySelector('textarea[name="message"]');
        const message = messageTextarea ? messageTextarea.value.trim() : '';
        
        // Create order object
        const order = {
            orderId: 'ORD-' + Date.now(),
            customer: customerInfo,
            items: checkoutItems,
            message: message,
            subtotal: subtotal,
            shipping: shipping,
            total: total,
            status: 'Pending',
            orderDate: new Date().toISOString(),
            orderDateFormatted: new Date().toLocaleString('en-PH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };

        // Decrement product stock based on ordered items (if products are stored)
        try {
            decrementStockForItems(checkoutItems);
        } catch (e) {
            console.warn('Could not decrement stock:', e);
        }

        // Save order to localStorage
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Remove checked out items from cart
        const allCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
        const checkoutItemIds = checkoutItems.map(item => String(item.id));
        const remainingItems = allCartItems.filter(item => !checkoutItemIds.includes(String(item.id)));
        
        // Update cart
        localStorage.setItem('cartItems', JSON.stringify(remainingItems));
        const cartCount = remainingItems.reduce((sum, item) => sum + (parseInt(item.qty, 10) || 0), 0);
        localStorage.setItem('cartCount', String(cartCount));
        
        // Clear checkout items
        localStorage.removeItem('checkoutItems');
        
        // Dispatch cart updated event
        window.dispatchEvent(new CustomEvent('cart:updated', { 
            detail: { count: cartCount, items: remainingItems } 
        }));
        
        // Show success message with order details
        const paymentMethodText = paymentMethod === 'cod' ? 'Cash on Delivery' : 
                                 paymentMethod === 'cash' ? 'Cash (Pick-up)' : 
                                 'GCash';
        const deliveryMethodText = deliveryMethod === 'delivery' ? 'Home Delivery' : 'Store Pick-up';
        
        const successMessage = `✅ Order placed successfully!\n\n` +
                             `Order ID: ${order.orderId}\n` +
                             `Total: ₱${total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}\n\n` +
                             `Delivery: ${deliveryMethodText}\n` +
                             `Payment: ${paymentMethodText}\n\n` +
                             `Thank you for your order!`;
        alert(successMessage);
        
        // Save address if checkbox is checked
        if (deliveryMethod === 'delivery') {
            const saveAddressCheckbox = document.getElementById('save-address');
            if (saveAddressCheckbox && saveAddressCheckbox.checked) {
                saveAddress(customerInfo);
            }
        }
        
        // Redirect to homepage
        window.location.href = '4Dsigns.html';
    } catch (error) {
        console.error('Error placing order:', error);
        alert('An error occurred while placing your order. Please try again.');
    }
}

// ====== SAVED ADDRESSES MANAGEMENT ======
function getSavedAddresses() {
    try {
        return JSON.parse(localStorage.getItem('savedAddresses') || '[]');
    } catch(e) {
        return [];
    }
}

function saveAddress(customerInfo) {
    const addresses = getSavedAddresses();
    
    // Create address object
    const newAddress = {
        id: Date.now(),
        name: customerInfo.name,
        phone: customerInfo.phone,
        email: customerInfo.email,
        street: customerInfo.address.street,
        barangay: customerInfo.address.barangay,
        city: customerInfo.address.city,
        province: customerInfo.address.province,
        zipCode: customerInfo.address.zipCode,
        landmark: customerInfo.address.landmark,
        fullAddress: customerInfo.fullAddress,
        savedDate: new Date().toISOString()
    };
    
    // Check if address already exists (same full address)
    const exists = addresses.some(addr => 
        addr.fullAddress === newAddress.fullAddress && 
        addr.phone === newAddress.phone
    );
    
    if (!exists) {
        addresses.push(newAddress);
        // Keep only last 5 addresses
        if (addresses.length > 5) {
            addresses.shift();
        }
        localStorage.setItem('savedAddresses', JSON.stringify(addresses));
        console.log('Address saved successfully');
    }
}

function loadSavedAddresses() {
    const addresses = getSavedAddresses();
    const addressSelector = document.getElementById('address-selector');
    const savedAddressSection = document.getElementById('saved-address-section');
    
    if (addresses.length > 0 && addressSelector) {
        // Show the saved address section
        savedAddressSection.style.display = 'block';
        
        // Clear existing options except first two (default and "new")
        while (addressSelector.options.length > 2) {
            addressSelector.remove(2);
        }
        
        // Add saved addresses to selector
        addresses.forEach((addr, index) => {
            const option = document.createElement('option');
            option.value = addr.id;
            option.textContent = `${addr.name} - ${addr.street}, ${addr.city}`;
            addressSelector.appendChild(option);
        });
    }
}

function initializeAddressSelector() {
    const addressSelector = document.getElementById('address-selector');
    
    if (addressSelector) {
        addressSelector.addEventListener('change', function() {
            const selectedValue = this.value;
            
            if (selectedValue === 'new' || selectedValue === '') {
                // Clear form for new address
                clearAddressForm();
                return;
            }
            
            // Load selected address
            const addresses = getSavedAddresses();
            const selectedAddress = addresses.find(addr => addr.id == selectedValue);
            
            if (selectedAddress) {
                fillAddressForm(selectedAddress);
            }
        });
    }
}

function clearAddressForm() {
    document.getElementById('name').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('email').value = '';
    document.getElementById('street').value = '';
    document.getElementById('barangay').value = '';
    document.getElementById('city').value = '';
    document.getElementById('province').value = '';
    document.getElementById('zipCode').value = '';
    document.getElementById('landmark').value = '';
}

function fillAddressForm(address) {
    document.getElementById('name').value = address.name || '';
    document.getElementById('phone').value = address.phone || '';
    document.getElementById('email').value = address.email || '';
    document.getElementById('street').value = address.street || '';
    document.getElementById('barangay').value = address.barangay || '';
    document.getElementById('city').value = address.city || '';
    document.getElementById('province').value = address.province || '';
    document.getElementById('zipCode').value = address.zipCode || '';
    document.getElementById('landmark').value = address.landmark || '';
}

