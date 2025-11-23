document.addEventListener('DOMContentLoaded', () => {
    // Load orders from localStorage
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    let reviews = JSON.parse(localStorage.getItem('reviews')) || [];

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
            
            return `
                <div class="order-card">
                    <div class="order-header">
                        <div class="order-id-section">
                            <h3><i class="fas fa-receipt"></i> Order #${order.orderId}</h3>
                            <p class="order-date">${order.orderDateFormatted || new Date(order.orderDate).toLocaleDateString('en-PH')}</p>
                        </div>
                        <div class="order-status-section">
                            <span class="status-badge status-${order.status.toLowerCase().replace(' ', '-')}">${order.status}</span>
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
            'Completed': 5
        };
        
        const currentStep = trackingSteps[order.status] || 1;
        
        let trackingHTML = `
            <div class="tracking-modal-overlay" onclick="closeTrackingModal()">
                <div class="tracking-modal-content" onclick="event.stopPropagation()">
                    <span class="close-tracking" onclick="closeTrackingModal()">&times;</span>
                    <h2><i class="fas fa-map-marker-alt"></i> Track Order</h2>
                    <div class="tracking-order-info">
                        <p><strong>Order ID:</strong> ${order.orderId}</p>
                        <p><strong>Order Date:</strong> ${order.orderDateFormatted}</p>
                        <p><strong>Delivery Method:</strong> ${order.customer.deliveryMethod === 'delivery' ? 'Home Delivery' : 'Store Pick-up'}</p>
                    </div>
                    
                    <div class="tracking-timeline">
                        <div class="tracking-step ${currentStep >= 1 ? 'completed' : ''}">
                            <div class="tracking-icon">
                                <i class="fas fa-clipboard-check"></i>
                            </div>
                            <div class="tracking-content">
                                <h4>Order Placed</h4>
                                <p>Your order has been received</p>
                            </div>
                        </div>
                        
                        <div class="tracking-step ${currentStep >= 2 ? 'completed' : ''}">
                            <div class="tracking-icon">
                                <i class="fas fa-cogs"></i>
                            </div>
                            <div class="tracking-content">
                                <h4>Processing</h4>
                                <p>Your order is being prepared</p>
                            </div>
                        </div>
                        
                        <div class="tracking-step ${currentStep >= 3 ? 'completed' : ''}">
                            <div class="tracking-icon">
                                <i class="fas fa-box"></i>
                            </div>
                            <div class="tracking-content">
                                <h4>Shipped</h4>
                                <p>Your order has been dispatched</p>
                            </div>
                        </div>
                        
                        <div class="tracking-step ${currentStep >= 4 ? 'completed' : ''}">
                            <div class="tracking-icon">
                                <i class="fas fa-truck"></i>
                            </div>
                            <div class="tracking-content">
                                <h4>Out for Delivery</h4>
                                <p>Your order is on the way</p>
                            </div>
                        </div>
                        
                        <div class="tracking-step ${currentStep >= 5 ? 'completed' : ''}">
                            <div class="tracking-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="tracking-content">
                                <h4>Delivered</h4>
                                <p>Your order has been delivered</p>
                            </div>
                        </div>
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

    // Initial display of orders
    displayOrders();
});
