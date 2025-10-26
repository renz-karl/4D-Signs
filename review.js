document.addEventListener('DOMContentLoaded', () => {
    // Mock data - Replace with actual data from your backend
    const orders = [
        {
            id: 1,
            productName: 'Custom T-Shirt',
            image: 'images/shirt-outline.jpg',
            orderDate: '2025-09-28',
            status: 'delivered',
            hasReview: false
        },
        {
            id: 2,
            productName: 'Custom Mug',
            image: 'images/mug-outline.jpg',
            orderDate: '2025-09-29',
            status: 'pickup',
            hasReview: false
        },
        {
            id: 3,
            productName: 'Custom Sign',
            image: 'images/sign-outline.jpg',
            orderDate: '2025-09-30',
            status: 'processing',
            hasReview: false
        }
    ];

    const ordersList = document.getElementById('orders-list');
    const modal = document.getElementById('review-modal');
    const closeModal = document.querySelector('.close-modal');
    const stars = document.querySelectorAll('.star');
    let selectedRating = 0;
    let currentOrderId = null;

    // Display orders
    function displayOrders() {
        ordersList.innerHTML = orders.map(order => `
            <div class="order-item">
                <img src="${order.image}" alt="${order.productName}" class="order-image">
                <div class="order-details">
                    <h3>${order.productName}</h3>
                    <p>Order Date: ${order.orderDate}</p>
                    <p>Status: <span class="status-${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></p>
                    ${order.status === 'delivered' || order.status === 'pickup' ? 
                        `<button onclick="openReviewModal(${order.id})" ${order.hasReview ? 'disabled' : ''}>
                            ${order.hasReview ? 'Review Submitted' : 'Leave a Review'}
                        </button>` : 
                        ''}
                </div>
            </div>
        `).join('');
    }

    // Initialize review modal functionality
    window.openReviewModal = (orderId) => {
        currentOrderId = orderId;
        const order = orders.find(o => o.id === orderId);
        document.getElementById('modal-product-image').src = order.image;
        document.getElementById('modal-product-name').textContent = order.productName;
        modal.style.display = 'block';
        resetReviewForm();
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
        const comment = document.getElementById('review-comment').value;
        if (selectedRating === 0) {
            alert('Please select a rating.');
            return;
        }

        // Here you would normally send this data to your backend
        console.log('Order ID:', currentOrderId);
        console.log('Rating:', selectedRating);
        console.log('Comment:', comment);

        // Update the order's review status
        const orderIndex = orders.findIndex(o => o.id === currentOrderId);
        if (orderIndex !== -1) {
            orders[orderIndex].hasReview = true;
        }

        // Update the display
        displayOrders();
        modal.style.display = 'none';
        alert('Thank you for your review!');
    });

    // Initial display of orders
    displayOrders();
});
