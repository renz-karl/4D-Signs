document.addEventListener('DOMContentLoaded', () => {
    // Load orders from localStorage
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    let reviews = JSON.parse(localStorage.getItem('reviews')) || [];

    // Show all orders for admin, or only user's orders if logged in
    function getLoggedInUser() {
        try { return JSON.parse(localStorage.getItem('loggedInUser') || 'null'); } catch(e){ return null; }
    }
    const user = getLoggedInUser();
    if (user && user.email) {
        orders = orders.filter(o => o.customer && o.customer.email === user.email);
    } else {
        // If not logged in, show all orders (for admin or demo)
        // orders = orders; // No filter
    }

    const ordersList = document.getElementById('orders-list');
    const modal = document.getElementById('review-modal');
    const closeModal = document.querySelector('.close-modal');
    const stars = document.querySelectorAll('.star');
    let selectedRating = 0;
    let currentOrderId = null;

    // Display orders
    function displayOrders() {
        if (orders.length === 0) {
            ordersList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <h3>No Orders Yet</h3>
                    <p>You haven't placed any orders yet.</p>
                    <a href="4Dsigns.html" class="shop-now-btn">Start Shopping</a>
                </div>
            `;
            return;
        }

        ordersList.innerHTML = orders.map((order, index) => {
            const hasReview = reviews.some(r => r.orderId === order.orderId);
            const canReview = order.status === 'Completed' || order.status === 'Delivered';
            const canCancel = order.status === 'Pending' || order.status === 'Processing';
            const cancelable = canCancel && ((Date.now() - new Date(order.orderDate)) / (1000 * 60 * 60) <= 24);
            
            return `
                <div class="order-card">
                    ${order.status === 'Cancelled' ? `<div class="order-cancel-ribbon">CANCELLED</div>` : ''}
                    <div class="order-header">
                        <div class="order-id-section">
                            <h3><i class="fas fa-receipt"></i> Order #${order.orderId}</h3>
                            <p class="order-date">${order.orderDateFormatted || new Date(order.orderDate).toLocaleDateString('en-PH')}</p>
                        </div>
                        <div class="order-status-section">
                            ${order.status === 'Cancelled' ?
                                `<span class="status-badge status-cancelled"><i class="fas fa-ban"></i></span>` :
                                `<span class="status-badge status-${order.status.toLowerCase().replace(' ', '-')}">${order.status}</span>`
                            }
                        </div>
                    </div>
                    
                    <div class="order-items">
                        ${order.items.map(item => `
                            <div class="order-item">
                                <img src="${item.image || 'ProductPics/default-product.png'}" alt="${item.name}" class="order-item-image">
                                <div class="order-item-details">
                                    <h4>${item.name}</h4>
                                    ${item.size ? `<p class="item-meta">Size: ${item.size}</p>` : ''}
                                    ${item.color ? `<p class="item-meta">Color: ${item.color}</p>` : ''}
                                    ${item.isCustom ? '<span class="custom-badge"><i class="fas fa-magic"></i> Custom Design</span>' : ''}
                                    <p class="item-quantity">Qty: ${item.qty}</p>
                                </div>
                                <div class="order-item-price">
                                    ₱${(item.price * item.qty).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="order-footer">
                        <div class="order-total">
                            <span>Total:</span>
                            <span class="total-amount">₱${order.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div class="order-actions">
                            ${canReview && !hasReview ? 
                                `<button class="review-btn" onclick="openReviewModal('${order.orderId}')">
                                    <i class="fas fa-star"></i> Leave a Review
                                </button>` : 
                                hasReview ? 
                                `<button class="review-btn submitted" disabled>
                                    <i class="fas fa-check-circle"></i> Review Submitted
                                </button>` :
                                `<button class="track-btn" onclick="trackOrder('${order.orderId}')">
                                    <i class="fas fa-shipping-fast"></i> Track Order
                                </button>`
                            }
                            ${canCancel ? 
                                `<button class="cancel-btn" onclick="requestCancelOrder('${order.orderId}')" ${!cancelable ? 'disabled' : ''}><i class='fas fa-ban'></i> Cancel Order</button>` : 
                                ''
                            }
                        </div>
                    </div>
                </div>
            `;
        }).reverse().join(''); // Reverse to show newest first
    }

    // Initialize review modal functionality
    window.openReviewModal = (orderId) => {
        currentOrderId = orderId;
        const order = orders.find(o => o.orderId === orderId);
        if (!order) return;
        
        // Show first item image and order info
        const firstItem = order.items[0];
        document.getElementById('modal-product-image').src = firstItem.image || 'ProductPics/default-product.png';
        document.getElementById('modal-product-name').textContent = `Order #${order.orderId}`;
        document.getElementById('modal-order-items').textContent = `${order.items.length} item(s)`;
        
        modal.style.display = 'block';
        resetReviewForm();
    };

    // Track order function
    window.trackOrder = (orderId) => {
        const order = orders.find(o => o.orderId === orderId);
        if (!order) return;
        const trackingSteps = {
            'Pending': 1,
            'Processing': 2,
            'Shipped': 3,
            'Out for Delivery': 4,
            'Delivered': 5,
            'Completed': 5,
            'Cancelled': 0
        };
        const currentStep = trackingSteps[order.status] || 1;

        // Build a clear cancellation info if present
        let cancelInfoHTML = '';
        if (order.status === 'Cancelled' || order.cancelRequest) {
            const req = order.cancelRequest || {};
            const when = req.requestedAt ? new Date(req.requestedAt).toLocaleString('en-PH', {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : 'Unknown time';
            const by = req.by || (order.customer && order.customer.email) || 'Unknown';
            const reason = req.reason || 'No reason provided.';
            const refund = order.refundStatus ? `<div class="cancel-refund"><strong>Refund status:</strong> ${order.refundStatus}</div>` : '';
            cancelInfoHTML = `
                <div class="cancel-info-panel">
                    <div class="cancel-info-header">
                        <div class="cancel-icon"><i class="fas fa-ban"></i></div>
                        <div class="cancel-meta">
                            <h4>Order Cancelled</h4>
                            <div class="cancel-sub">${when} • by ${by}</div>
                        </div>
                    </div>
                    <div class="cancel-info-body">
                        <div class="cancel-reason"><strong>Reason:</strong> ${reason}</div>
                        ${refund}
                    </div>
                </div>
            `;
        }

        // If cancelled, show a simplified timeline with Cancelled as the main state
        let timelineHTML = '';
        if (order.status === 'Cancelled') {
            timelineHTML = `
                <div class="tracking-step completed cancelled">
                    <div class="tracking-icon">
                        <i class="fas fa-ban"></i>
                    </div>
                    <div class="tracking-content">
                        <h4>Cancelled</h4>
                        <p>The order has been cancelled and will not be processed further.</p>
                    </div>
                </div>
            `;
        } else {
            timelineHTML = `
                <div class="tracking-step ${currentStep >= 1 ? 'completed' : ''}">
                    <div class="tracking-icon"><i class="fas fa-clipboard-check"></i></div>
                    <div class="tracking-content"><h4>Order Placed</h4><p>Your order has been received</p></div>
                </div>
                <div class="tracking-step ${currentStep >= 2 ? 'completed' : ''}">
                    <div class="tracking-icon"><i class="fas fa-cogs"></i></div>
                    <div class="tracking-content"><h4>Processing</h4><p>Your order is being prepared</p></div>
                </div>
                <div class="tracking-step ${currentStep >= 3 ? 'completed' : ''}">
                    <div class="tracking-icon"><i class="fas fa-box"></i></div>
                    <div class="tracking-content"><h4>Shipped</h4><p>Your order has been dispatched</p></div>
                </div>
                <div class="tracking-step ${currentStep >= 4 ? 'completed' : ''}">
                    <div class="tracking-icon"><i class="fas fa-truck"></i></div>
                    <div class="tracking-content"><h4>Out for Delivery</h4><p>Your order is on the way</p></div>
                </div>
                <div class="tracking-step ${currentStep >= 5 ? 'completed' : ''}">
                    <div class="tracking-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="tracking-content"><h4>Delivered</h4><p>Your order has been delivered</p></div>
                </div>
            `;
        }

        let trackingHTML = `
            <div class="tracking-modal-overlay" onclick="closeTrackingModal()">
                <div class="tracking-modal-content" onclick="event.stopPropagation()">
                    <span class="close-tracking" onclick="closeTrackingModal()">&times;</span>
                    <h2><i class="fas fa-map-marker-alt"></i> Track Order</h2>
                    <div class="tracking-order-info">
                        <p><strong>Order ID:</strong> ${order.orderId}</p>
                        <p><strong>Order Date:</strong> ${order.orderDateFormatted}</p>
                        <p><strong>Delivery Method:</strong> ${order.customer.deliveryMethod === 'delivery' ? 'Home Delivery' : 'Store Pick-up'}</p>
                        ${cancelInfoHTML}
                    </div>
                    <div class="tracking-timeline">
                        ${timelineHTML}
                    </div>
                    <button class="close-tracking-btn" onclick="closeTrackingModal()">Close</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', trackingHTML);
    };

    window.closeTrackingModal = () => {
        const trackingModal = document.querySelector('.tracking-modal-overlay');
        if (trackingModal) {
            trackingModal.remove();
        }
    };

    closeModal.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    // Star rating functionality
    stars.forEach(star => {
        star.addEventListener('mouseover', (e) => {
            const rating = e.target.dataset.value;
            updateStarsDisplay(rating);
        });

        star.addEventListener('mouseout', () => {
            updateStarsDisplay(selectedRating);
        });

        star.addEventListener('click', (e) => {
            selectedRating = parseInt(e.target.dataset.value);
            updateStarsDisplay(selectedRating);
        });
    });

    function updateStarsDisplay(rating) {
        stars.forEach(s => {
            s.style.color = s.dataset.value <= rating ? '#f5b301' : '#ddd';
        });
    }

    function resetReviewForm() {
        selectedRating = 0;
        updateStarsDisplay(0);
        document.getElementById('review-comment').value = '';
    }

    // Submit review
    document.getElementById('submit-review').addEventListener('click', () => {
        const comment = document.getElementById('review-comment').value.trim();
        if (selectedRating === 0) {
            alert('Please select a rating.');
            return;
        }

        if (!comment) {
            alert('Please write a review comment.');
            return;
        }

        const order = orders.find(o => o.orderId === currentOrderId);
        if (!order) return;

        // Create review object
        const review = {
            reviewId: 'REV-' + Date.now(),
            orderId: currentOrderId,
            orderDate: order.orderDateFormatted,
            customerName: order.customer.name,
            items: order.items,
            rating: selectedRating,
            comment: comment,
            reviewDate: new Date().toISOString(),
            reviewDateFormatted: new Date().toLocaleString('en-PH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        };

        // Save review to localStorage
        reviews.push(review);
        localStorage.setItem('reviews', JSON.stringify(reviews));

        // Update the display
        displayOrders();
        modal.style.display = 'none';
        
        alert('✅ Thank you for your review!\n\nYour feedback helps us improve our service.');
    });

    // Cancel modal controller
    let currentCancelOrderId = null;
    const cancelModal = document.getElementById('cancel-modal');
    const closeCancelEl = document.querySelector('.close-cancel');

    window.requestCancelOrder = (orderId) => {
        // Open the cancel modal and set current order
        currentCancelOrderId = orderId;
        // Reset form
        const radios = document.getElementsByName('cancel-reason');
        radios.forEach(r => r.checked = false);
        if (radios[0]) radios[0].checked = true;
        document.getElementById('cancel-other').value = '';
        document.getElementById('cancel-other').style.display = 'none';
        if (cancelModal) cancelModal.style.display = 'block';
    };

    // Close handlers
    if (closeCancelEl) closeCancelEl.onclick = () => { if (cancelModal) cancelModal.style.display = 'none'; };
    document.getElementById('cancel-cancel')?.addEventListener('click', () => { if (cancelModal) cancelModal.style.display = 'none'; });

    // Show other textbox when Other is selected
    document.addEventListener('change', (e) => {
        if (e.target && e.target.name === 'cancel-reason') {
            const other = document.getElementById('cancel-other');
            if (e.target.value === 'Other') other.style.display = 'block'; else other.style.display = 'none';
            // visual selected state for option cards
            document.querySelectorAll('.cancel-option').forEach(lbl => lbl.classList.remove('selected'));
            const lbl = e.target.closest('.cancel-option');
            if (lbl) lbl.classList.add('selected');
        }
    });

    // Submit cancellation from modal
    document.getElementById('submit-cancel').addEventListener('click', () => {
        if (!currentCancelOrderId) return alert('No order selected.');
        const radios = document.getElementsByName('cancel-reason');
        let reason = '';
        radios.forEach(r => { if (r.checked) reason = r.value; });
        if (reason === 'Other') {
            const text = document.getElementById('cancel-other').value.trim();
            if (!text) return alert('Please provide a reason for cancellation.');
            reason = text;
        }
        performCancelOrder(currentCancelOrderId, reason);
        if (cancelModal) cancelModal.style.display = 'none';
    });

    function performCancelOrder(orderId, reason) {
        const order = orders.find(o => o.orderId === orderId);
        if (!order) return alert('Order not found.');
        // Only allow cancel if Pending or Processing
        if (order.status !== 'Pending' && order.status !== 'Processing') return alert('Cannot cancel this order.');
        // Check if within 24 hours
        const placed = new Date(order.orderDate);
        const now = new Date();
        const diffHrs = (now - placed) / (1000*60*60);
        if (diffHrs > 24) return alert('Cancellation only allowed within 24 hours of order placement.');
        if (!confirm('Are you sure you want to request cancellation for this order?')) return;
        // Mark as cancellation requested
        order.status = 'Cancelled';
        order.cancelRequest = {
            requestedAt: new Date().toISOString(),
            by: order.customer?.email || 'unknown',
            reason: reason || 'User requested cancellation.'
        };
        // Update orders in localStorage
        const idx = orders.findIndex(o => o.orderId === orderId);
        if (idx !== -1) {
            orders[idx] = order;
            localStorage.setItem('orders', JSON.stringify(orders));
        }
        alert('Your cancellation request has been submitted.');
        displayOrders();
    }

    displayOrders();
});
