// Check authentication
window.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('adminLoggedIn') !== 'true') {
        window.location.href = 'admin-login.html';
        return;
    }

    // Set admin name
    const adminName = sessionStorage.getItem('adminUsername') || 'Admin';
    document.getElementById('admin-name').textContent = adminName;

    // Load dashboard data
    loadDashboardData();
    loadProducts();
    loadPromoSettings();
    loadOrders();
    loadCustomers();
    loadReviews();
    loadMessages();
    updateUnreadBadge();
});

// Navigation
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.content-section');
const pageTitle = document.getElementById('page-title');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.getAttribute('data-section');
        
        // Update active link
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Update active section
        sections.forEach(s => s.classList.remove('active'));
        document.getElementById(`${sectionId}-section`).classList.add('active');
        
        // Update page title
        pageTitle.textContent = link.textContent.trim();
    });
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminUsername');
        window.location.href = 'admin-login.html';
    }
});

// Menu toggle for mobile
const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
}

// Load Dashboard Data
function loadDashboardData() {
    // Get products from storage
    const products = getProducts();
    document.getElementById('total-products').textContent = products.length;
    
    // Get orders
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    document.getElementById('total-orders').textContent = orders.length;
    
    // Get unique customers
    const customers = getUniqueCustomers(orders);
    document.getElementById('total-customers').textContent = customers.length;
    
    // Calculate revenue
    let totalRevenue = 0;
    orders.forEach(order => {
        // Parse total as number if it's a string
        let orderTotal = 0;
        if (typeof order.total === 'number') {
            orderTotal = order.total;
        } else if (typeof order.total === 'string') {
            orderTotal = parseFloat(order.total.replace('₱', '').replace(/,/g, '')) || 0;
        } else {
            // Fallback: calculate from items if total is missing
            orderTotal = (order.subtotal || 0) + (order.shipping || 0);
        }
        totalRevenue += orderTotal;
    });
    document.getElementById('total-revenue').textContent = '₱' + totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // Get reviews
    const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
    document.getElementById('dashboard-total-reviews').textContent = reviews.length;
    
    // Get messages
    const messages = JSON.parse(localStorage.getItem('contactMessages')) || [];
    const unreadMessages = messages.filter(m => m.status === 'Unread').length;
    document.getElementById('dashboard-unread-messages').textContent = unreadMessages;
    
    console.log('Dashboard Stats:', {
        totalOrders: orders.length,
        totalRevenue: totalRevenue,
        totalReviews: reviews.length,
        unreadMessages: unreadMessages,
        orders: orders.map(o => ({ id: o.orderId, total: o.total }))
    });
    
    // Load recent activity
    loadRecentActivity(orders);
}

// Get unique customers from orders
function getUniqueCustomers(orders) {
    const customers = new Map();
    orders.forEach(order => {
        if (order.customer && order.customer.email) {
            if (!customers.has(order.customer.email)) {
                customers.set(order.customer.email, {
                    name: order.customer.name,
                    email: order.customer.email,
                    phone: order.customer.phone,
                    totalOrders: 0,
                    totalSpent: 0
                });
            }
            const customer = customers.get(order.customer.email);
            customer.totalOrders++;
            
            // Parse total properly
            let orderTotal = 0;
            if (typeof order.total === 'number') {
                orderTotal = order.total;
            } else if (typeof order.total === 'string') {
                orderTotal = parseFloat(order.total.replace('₱', '').replace(/,/g, '')) || 0;
            } else {
                orderTotal = (order.subtotal || 0) + (order.shipping || 0);
            }
            customer.totalSpent += orderTotal;
        }
    });
    return Array.from(customers.values());
}

// Load recent activity
function loadRecentActivity(orders) {
    const activityList = document.getElementById('activity-list');
    
    if (orders.length === 0) {
        activityList.innerHTML = '<p class="no-data">No recent activity</p>';
        return;
    }
    
    // Get last 5 orders
    const recentOrders = orders.slice(-5).reverse();
    
    activityList.innerHTML = recentOrders.map(order => {
        // Parse total properly
        let orderTotal = 0;
        if (typeof order.total === 'number') {
            orderTotal = order.total;
        } else if (typeof order.total === 'string') {
            orderTotal = parseFloat(order.total.replace('₱', '').replace(/,/g, '')) || 0;
        } else {
            orderTotal = (order.subtotal || 0) + (order.shipping || 0);
        }
        
        return `
        <div style="padding: 12px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="color: #1e293b;">${order.orderId}</strong>
                <p style="font-size: 0.9rem; color: #64748b; margin: 4px 0 0 0;">${order.customer.name} - ${order.orderDateFormatted}</p>
            </div>
            <div style="text-align: right;">
                <strong style="color: #059669; font-size: 1.05rem;">₱${orderTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                <p style="font-size: 0.85rem; color: #f59e0b; margin: 4px 0 0 0;">${order.status}</p>
            </div>
        </div>`;
    }).join('');
}

// Get products from the main page
// Products storage: read from localStorage if present, otherwise seed defaults
function getProducts() {
    try {
        const stored = localStorage.getItem('products');
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error('Failed to parse products from storage', e);
    }

    // Seed default products (will be saved to localStorage)
    const seed = [
        { id: 'prod-giveaways', name: 'Giveaways', price: '₱100.00 - ₱400.00', stock: 30, reviews: 98, image: 'ProductPics/Giveaways.jpg' },
        { id: 'prod-bulk', name: 'Bulk Packages', price: '₱1,000.00 - ₱5,000.00', stock: 15, reviews: 54, image: '' },
        { id: 'prod-signage', name: 'Custom Signage', price: '₱500.00 - ₱3,000.00', stock: 50, reviews: 120, image: '' },
        { id: 'prod-banners', name: 'Banners', price: '₱300.00 - ₱1,500.00', stock: 80, reviews: 89, image: '' },
        { id: 'prod-stickers', name: 'Stickers & Decals', price: '₱50.00 - ₱300.00', stock: 150, reviews: 142, image: 'ProductPics/Sticker.jpg' },
        { id: 'prod-mugs', name: 'Custom Mugs', price: '₱250.00 - ₱600.00', stock: 60, reviews: 88, image: 'ProductPics/Mugs.jpg' },
        { id: 'prod-tshirt', name: 'T-Shirt Printing', price: '₱350.00 - ₱800.00', stock: 100, reviews: 156, image: '' },
        { id: 'prod-keychains', name: 'Keychains', price: '₱80.00 - ₱250.00', stock: 200, reviews: 201, image: 'ProductPics/keychain.jpg' },
        { id: 'prod-invites', name: 'Invitations', price: '₱200.00 - ₱800.00', stock: 90, reviews: 75, image: '' },
        { id: 'prod-cards', name: 'Calling Cards', price: '₱150.00 - ₱500.00', stock: 120, reviews: 93, image: '' },
        { id: 'prod-pabitin', name: 'Pabitin', price: '₱800.00 - ₱2,500.00', stock: 35, reviews: 67, image: 'ProductPics/Pabitin.jpg' },
        { id: 'prod-hats', name: 'Party Hats', price: '₱150.00 - ₱500.00', stock: 120, reviews: 134, image: 'ProductPics/PartyHats.jpg' }
    ];

    try {
        localStorage.setItem('products', JSON.stringify(seed));
    } catch (e) {
        console.error('Failed to seed products to storage', e);
    }
    return seed;
}

// Save products array to localStorage
function saveProducts(products) {
    try {
        localStorage.setItem('products', JSON.stringify(products));
    } catch (e) {
        console.error('Failed to save products', e);
    }
}

// Adjust stock for a product by name or id
function adjustStock(productIdentifier, delta) {
    const products = getProducts();
    const idx = products.findIndex(p => p.id === productIdentifier || p.name === productIdentifier);
    if (idx === -1) {
        alert('Product not found: ' + productIdentifier);
        return;
    }
    products[idx].stock = Math.max(0, (parseInt(products[idx].stock || 0, 10) || 0) + parseInt(delta, 10));
    saveProducts(products);
    loadProducts();
    loadDashboardData();
}

// Load Products Table
function loadProducts() {
    const products = getProducts();
    const tableBody = document.getElementById('products-table');
    
    if (products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No products found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = products.map(product => `
        <tr>
            <td>
                ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">` : '<div style="width: 50px; height: 50px; background: #f1f5f9; border-radius: 8px;"></div>'}
            </td>
            <td><strong>${product.name}</strong></td>
            <td><strong style="color: #059669; font-size: 1.05rem;">${product.price}</strong></td>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    <button class="btn" onclick="adjustStock('${product.id}', -1)" title="Decrease stock">-</button>
                    <span style="color: ${product.stock > 50 ? '#22c55e' : product.stock > 20 ? '#f59e0b' : '#ef4444'}; font-weight:700;">${product.stock} items</span>
                    <button class="btn" onclick="adjustStock('${product.id}', 1)" title="Increase stock">+</button>
                </div>
                <div style="margin-top:6px;">
                    <input type="number" min="0" value="${product.stock}" style="width:80px;padding:4px;border:1px solid #e2e8f0;border-radius:6px;" onchange="setStock('${product.id}', this.value)">
                </div>
            </td>
            <td>⭐ ${product.reviews} reviews</td>
            <td>
                <button class="btn-edit" onclick="editProduct('${product.name}')" style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 5px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteProduct('${product.name}')" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Set stock to specific value
function setStock(productIdentifier, value) {
    const v = parseInt(value, 10);
    if (isNaN(v) || v < 0) {
        alert('Invalid stock value');
        loadProducts();
        return;
    }
    const products = getProducts();
    const idx = products.findIndex(p => p.id === productIdentifier || p.name === productIdentifier);
    if (idx === -1) {
        alert('Product not found');
        return;
    }
    products[idx].stock = v;
    saveProducts(products);
    loadProducts();
    loadDashboardData();
}

// Edit Product
// Edit Product - now supports updating price (and can be extended for other fields)
function editProduct(productIdentifier) {
    // productIdentifier may be id or name
    const products = getProducts();
    const idx = products.findIndex(p => p.id === productIdentifier || p.name === productIdentifier);
    if (idx === -1) {
        alert('Product not found: ' + productIdentifier);
        return;
    }

    const product = products[idx];
    // Prompt admin for new price (accepts string like '₱100.00 - ₱400.00')
    const currentPrice = product.price || '';
    const newPrice = prompt('Enter new price for "' + product.name + '" (e.g. "₱100.00 - ₱400.00"):', currentPrice);
    if (newPrice === null) return; // cancelled
    const trimmed = String(newPrice).trim();
    if (!trimmed) {
        alert('Price cannot be empty');
        return;
    }

    products[idx].price = trimmed;
    saveProducts(products);
    loadProducts();
    loadDashboardData();
    alert('Price updated for ' + product.name + ' → ' + trimmed);
}

// Delete Product
function deleteProduct(productName) {
    if (confirm(`Are you sure you want to delete "${productName}"?`)) {
        alert('Delete functionality - Coming soon!');
    }
}

// Add Product Button
document.getElementById('add-product-btn').addEventListener('click', () => {
    alert('Add product functionality - Coming soon!');
});

// Settings Form
document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
    }
    
    // In a real application, you would save this to a backend
    // For now, just show a message
    alert('Password change functionality requires backend implementation.\n\nTo change password:\n1. Open admin-login.js\n2. Find ADMIN_ACCOUNT object\n3. Change the password value\n4. Save the file');
    document.getElementById('settings-form').reset();
});

// --- Promo settings helpers ---
function getPromo() {
    try {
        const p = localStorage.getItem('promo');
        if (!p) return { active: false, percent: 30 };
        return JSON.parse(p);
    } catch (e) {
        console.error('Failed to read promo from storage', e);
        return { active: false, percent: 30 };
    }
}

function savePromo(promo) {
    try {
        localStorage.setItem('promo', JSON.stringify(promo));
        // Notify other parts of the app
        window.dispatchEvent(new CustomEvent('promo:updated', { detail: promo }));
        // Also notify product renderers to refresh prices
        window.dispatchEvent(new CustomEvent('products:updated', { detail: { products: getProducts() } }));
    } catch (e) {
        console.error('Failed to save promo', e);
    }
}

function loadPromoSettings() {
    const promo = getPromo();
    const activeEl = document.getElementById('promo-active');
    const percentEl = document.getElementById('promo-percent');
    if (activeEl) activeEl.checked = !!promo.active;
    if (percentEl) percentEl.value = Number(promo.percent || 30);

    // Hook up buttons
    const saveBtn = document.getElementById('save-promo-btn');
    const clearBtn = document.getElementById('clear-promo-btn');

    if (saveBtn) {
        saveBtn.onclick = function() {
            const active = !!(document.getElementById('promo-active') && document.getElementById('promo-active').checked);
            const percent = Math.max(0, Math.min(100, parseInt(document.getElementById('promo-percent')?.value || '30', 10) || 0));
            savePromo({ active, percent });
            alert('Promo settings saved');
            loadProducts();
            loadDashboardData();
        };
    }

    if (clearBtn) {
        clearBtn.onclick = function() {
            if (!confirm('Clear promo settings? This will disable any active promotion.')) return;
            savePromo({ active: false, percent: 30 });
            if (document.getElementById('promo-active')) document.getElementById('promo-active').checked = false;
            if (document.getElementById('promo-percent')) document.getElementById('promo-percent').value = 30;
            alert('Promo cleared');
            loadProducts();
            loadDashboardData();
        };
    }
}

// Load Orders Table
function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const tableBody = document.getElementById('orders-table');
    
    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No orders yet</td></tr>';
        return;
    }
    
    // Reverse to show newest first
    const sortedOrders = [...orders].reverse();
    
    tableBody.innerHTML = sortedOrders.map(order => {
        // Show cancel info if present
        let cancelInfo = '';
        if (order.status === 'Cancelled' && order.cancelRequest) {
            cancelInfo = `<div style="color:#b91c1c; font-size:0.92em; margin-top:4px;">
                <i class='fas fa-ban'></i> Cancelled by: ${order.cancelRequest.by || 'User'}<br>
                <span>At: ${new Date(order.cancelRequest.requestedAt).toLocaleString('en-PH', {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span><br>
                <span>Reason: ${order.cancelRequest.reason || 'N/A'}</span>
            </div>`;
        }
        return `
        <tr>
            <td><strong>${order.orderId}</strong>${cancelInfo}</td>
            <td>${order.customer.name}<br><small style="color: #64748b;">${order.customer.email}</small></td>
            <td>${order.items.map(item => `${item.name} (x${item.quantity || item.qty || 1})`).join(', ')}</td>
            <td>${order.items.reduce((sum, item) => sum + (item.quantity || item.qty || 1), 0)} items</td>
            <td><strong style="color: #059669; font-size: 1.1rem;">₱${(order.total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
            <td>
                <select onchange="updateOrderStatus('${order.orderId}', this.value)" style="padding: 6px 10px; border: 2px solid #e2e8f0; border-radius: 6px; background: ${getStatusColor(order.status)}; font-weight: 600;">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td>
                <button onclick="viewOrderDetails('${order.orderId}')" style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 5px;">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="deleteOrder('${order.orderId}')" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

// Get status color
function getStatusColor(status) {
    switch(status) {
        case 'Pending': return '#fef3c7';
        case 'Processing': return '#dbeafe';
        case 'Shipped': return '#e0e7ff';
        case 'Delivered': return '#d1fae5';
        case 'Cancelled': return '#fee2e2';
        default: return '#f1f5f9';
    }
}

// Update order status
function updateOrderStatus(orderId, newStatus) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const orderIndex = orders.findIndex(o => o.orderId === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        localStorage.setItem('orders', JSON.stringify(orders));
        loadOrders();
        loadDashboardData();
        alert(`Order ${orderId} status updated to: ${newStatus}`);
    }
}

// View order details
function viewOrderDetails(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.orderId === orderId);
    
    if (!order) return;
    
    const itemsList = order.items.map(item => {
        const qty = item.quantity || item.qty || 1;
        let price = 0;
        
        // Handle different price formats
        if (typeof item.price === 'number') {
            price = item.price;
        } else if (typeof item.price === 'string') {
            price = parseFloat(item.price.replace('₱', '').replace(/,/g, '')) || 0;
        }
        
        const lineTotal = price * qty;
        return `- ${item.name} (${item.color || item.design || 'Standard'}, ${item.size || 'Regular'}) x${qty} @ ₱${price.toLocaleString('en-PH', { minimumFractionDigits: 2 })} = ₱${lineTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    }).join('\n');
    
    alert(`ORDER DETAILS\n\nOrder ID: ${order.orderId}\nDate: ${order.orderDateFormatted}\nStatus: ${order.status}\n\nCUSTOMER:\nName: ${order.customer.name}\nEmail: ${order.customer.email}\nPhone: ${order.customer.phone}\nAddress: ${order.customer.fullAddress}\n\nDELIVERY METHOD:\n${order.customer.deliveryMethod === 'delivery' ? 'Delivery' : 'Pick-up'}\n\nPAYMENT METHOD:\n${order.customer.paymentMethod.toUpperCase()}\n\nITEMS:\n${itemsList}\n\nSubtotal: ₱${(order.subtotal || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}\nShipping: ₱${(order.shipping || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}\n━━━━━━━━━━━━━━━━━━━━\nTOTAL: ₱${(order.total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`);
}

// Delete order
function deleteOrder(orderId) {
    if (confirm(`Are you sure you want to delete order ${orderId}?`)) {
        let orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders = orders.filter(o => o.orderId !== orderId);
        localStorage.setItem('orders', JSON.stringify(orders));
        loadOrders();
        loadDashboardData();
        alert('Order deleted successfully!');
    }
}

// Load Customers Table
function loadCustomers() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const customers = getUniqueCustomers(orders);
    const tableBody = document.getElementById('customers-table');
    
    if (customers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No customers yet</td></tr>';
        return;
    }
    
    tableBody.innerHTML = customers.map((customer, index) => `
        <tr>
            <td>#${index + 1}</td>
            <td><strong>${customer.name}</strong></td>
            <td>${customer.email}<br><small style="color: #64748b;">${customer.phone}</small></td>
            <td>${customer.totalOrders}</td>
            <td><strong>₱${customer.totalSpent.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></td>
            <td>
                <button onclick="viewCustomerOrders('${customer.email}')" style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-eye"></i> View Orders
                </button>
            </td>
        </tr>
    `).join('');
}

// View customer orders
function viewCustomerOrders(email) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const customerOrders = orders.filter(o => o.customer.email === email);
    
    if (customerOrders.length === 0) {
        alert('No orders found for this customer.');
        return;
    }
    
    const ordersList = customerOrders.map(order => 
        `- Order ${order.orderId} (${order.orderDateFormatted}): ₱${order.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })} - ${order.status}`
    ).join('\n');
    
    alert(`CUSTOMER ORDERS\n\nEmail: ${email}\nTotal Orders: ${customerOrders.length}\n\n${ordersList}`);
}

// Load Reviews
function loadReviews() {
    const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
    const reviewsGrid = document.getElementById('reviews-grid');
    
    // Update stats
    document.getElementById('total-reviews').textContent = reviews.length;
    
    if (reviews.length === 0) {
        const avgRating = 0;
        document.getElementById('average-rating').textContent = avgRating.toFixed(1);
        reviewsGrid.innerHTML = `
            <div class="no-reviews">
                <i class="fas fa-star-half-alt"></i>
                <p>No reviews yet</p>
            </div>
        `;
        return;
    }
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = totalRating / reviews.length;
    document.getElementById('average-rating').textContent = avgRating.toFixed(1);
    
    // Sort reviews by date (newest first)
    const sortedReviews = [...reviews].sort((a, b) => 
        new Date(b.reviewDate) - new Date(a.reviewDate)
    );
    
    // Display reviews
    reviewsGrid.innerHTML = sortedReviews.map(review => {
        const stars = generateStars(review.rating);
        const itemsList = review.items.map(item => item.name).join(', ');
        
        return `
            <div class="review-card">
                <div class="review-header">
                    <div class="review-customer">
                        <div class="customer-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="customer-info">
                            <h4>${review.customerName}</h4>
                            <p class="review-date">
                                <i class="fas fa-calendar"></i> ${review.reviewDateFormatted}
                            </p>
                        </div>
                    </div>
                    <div class="review-rating">
                        ${stars}
                        <span class="rating-number">${review.rating}.0</span>
                    </div>
                </div>
                
                <div class="review-order-info">
                    <p><strong>Order ID:</strong> ${review.orderId}</p>
                    <p><strong>Products:</strong> ${itemsList}</p>
                </div>
                
                <div class="review-comment">
                    <p>${review.comment}</p>
                </div>
                
                <div class="review-actions">
                    <button onclick="deleteReview('${review.reviewId}')" class="btn-delete">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Generate star icons
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star" style="color: #FFD700;"></i>';
        } else {
            stars += '<i class="far fa-star" style="color: #ddd;"></i>';
        }
    }
    return stars;
}

// Delete review
function deleteReview(reviewId) {
    if (confirm('Are you sure you want to delete this review?')) {
        let reviews = JSON.parse(localStorage.getItem('reviews')) || [];
        reviews = reviews.filter(r => r.reviewId !== reviewId);
        localStorage.setItem('reviews', JSON.stringify(reviews));
        loadReviews();
        loadDashboardData();
        alert('Review deleted successfully!');
    }
}

// Load Messages
let currentFilter = 'all';

function loadMessages(filter = 'all') {
    currentFilter = filter;
    const messages = JSON.parse(localStorage.getItem('contactMessages')) || [];
    const messagesGrid = document.getElementById('messages-grid');
    
    if (messages.length === 0) {
        messagesGrid.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-inbox"></i>
                <p>No messages yet</p>
            </div>
        `;
        return;
    }
    
    // Filter messages
    let filteredMessages = messages;
    if (filter !== 'all') {
        filteredMessages = messages.filter(m => m.status === filter);
    }
    
    // Sort messages by date (newest first)
    const sortedMessages = [...filteredMessages].sort((a, b) => 
        new Date(b.createdDate) - new Date(a.createdDate)
    );
    
    if (sortedMessages.length === 0) {
        messagesGrid.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-inbox"></i>
                <p>No ${filter.toLowerCase()} messages</p>
            </div>
        `;
        return;
    }
    
    // Display messages
    messagesGrid.innerHTML = sortedMessages.map(msg => {
        const statusClass = msg.status.toLowerCase();
        const statusIcon = msg.status === 'Unread' ? 'envelope' : 
                          msg.status === 'Read' ? 'envelope-open' : 'reply';
        
        return `
            <div class="message-card ${statusClass}">
                <div class="message-header">
                    <div class="message-customer">
                        <div class="customer-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="customer-info">
                            <h4>${msg.name}</h4>
                            <p class="message-email">
                                <i class="fas fa-envelope"></i> ${msg.email}
                            </p>
                            <p class="message-phone">
                                <i class="fas fa-phone"></i> ${msg.phone}
                            </p>
                        </div>
                    </div>
                    <div class="message-status-badge">
                        <span class="status-badge status-${statusClass}">
                            <i class="fas fa-${statusIcon}"></i> ${msg.status}
                        </span>
                        <p class="message-date">
                            <i class="fas fa-calendar"></i> ${msg.createdDateFormatted}
                        </p>
                    </div>
                </div>
                
                <div class="message-subject">
                    <i class="fas fa-tag"></i> 
                    <strong>Subject:</strong> ${msg.subject}
                </div>
                
                <div class="message-body">
                    <p>${msg.message}</p>
                </div>
                
                ${msg.reply ? `
                    <div class="message-reply">
                        <div class="reply-header">
                            <i class="fas fa-reply"></i> Admin Reply
                            <span class="reply-date">${msg.replyDateFormatted}</span>
                        </div>
                        <p>${msg.reply}</p>
                        ${msg.replyImages && msg.replyImages.length > 0 ? `
                            <div class="reply-images">
                                <p style="margin-top: 15px; font-weight: 600; color: #667eea;">
                                    <i class="fas fa-images"></i> Attached Images (${msg.replyImages.length}):
                                </p>
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-top: 10px;">
                                    ${msg.replyImages.map((img, index) => `
                                        <img src="${img.data}" alt="Attachment ${index + 1}" 
                                             style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                                             onclick="window.open('${img.data}', '_blank')">
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                <div class="message-actions">
                    ${msg.status === 'Unread' ? `
                        <button onclick="markAsRead('${msg.messageId}')" class="btn-mark-read">
                            <i class="fas fa-check"></i> Mark as Read
                        </button>
                    ` : ''}
                    ${msg.status !== 'Replied' ? `
                        <button onclick="openReplyModal('${msg.messageId}')" class="btn-reply">
                            <i class="fas fa-reply"></i> Reply
                        </button>
                    ` : ''}
                    <button onclick="deleteMessage('${msg.messageId}')" class="btn-delete">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Message filter buttons
document.addEventListener('DOMContentLoaded', () => {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
            loadMessages(filter);
        });
    });
});

// Mark message as read
function markAsRead(messageId) {
    let messages = JSON.parse(localStorage.getItem('contactMessages')) || [];
    const messageIndex = messages.findIndex(m => m.messageId === messageId);
    
    if (messageIndex !== -1) {
        messages[messageIndex].status = 'Read';
        localStorage.setItem('contactMessages', JSON.stringify(messages));
        loadMessages(currentFilter);
        loadDashboardData();
        updateUnreadBadge();
    }
}

// Open reply modal
function openReplyModal(messageId) {
    const messages = JSON.parse(localStorage.getItem('contactMessages')) || [];
    const message = messages.find(m => m.messageId === messageId);
    
    if (!message) return;
    
    // Store current message ID
    window.currentReplyMessageId = messageId;
    window.currentReplyMessage = message;
    window.replyImages = [];
    
    // Populate modal with message details
    document.getElementById('reply-customer-name').textContent = message.name;
    document.getElementById('reply-customer-email').textContent = message.email;
    document.getElementById('reply-subject').textContent = message.subject;
    document.getElementById('reply-original-message').textContent = message.message;
    document.getElementById('reply-text').value = '';
    document.getElementById('image-preview-container').innerHTML = '';
    
    // Show modal
    document.getElementById('reply-modal').style.display = 'flex';
    
    // Setup image upload handler
    setupImageUpload();
}

// Close reply modal
function closeReplyModal() {
    document.getElementById('reply-modal').style.display = 'none';
    window.currentReplyMessageId = null;
    window.currentReplyMessage = null;
    window.replyImages = [];
}

// Setup image upload functionality
function setupImageUpload() {
    const imageInput = document.getElementById('reply-image-input');
    
    imageInput.onchange = function(e) {
        const files = Array.from(e.target.files);
        
        // Limit to 5 images
        if (window.replyImages.length + files.length > 5) {
            alert('⚠️ You can only attach up to 5 images');
            return;
        }
        
        files.forEach(file => {
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                alert(`⚠️ ${file.name} is too large. Max size is 5MB`);
                return;
            }
            
            // Check if it's an image
            if (!file.type.startsWith('image/')) {
                alert(`⚠️ ${file.name} is not an image`);
                return;
            }
            
            // Read and preview image
            const reader = new FileReader();
            reader.onload = function(event) {
                const imageData = {
                    name: file.name,
                    data: event.target.result,
                    size: file.size
                };
                
                window.replyImages.push(imageData);
                displayImagePreview(imageData, window.replyImages.length - 1);
            };
            reader.readAsDataURL(file);
        });
        
        // Clear input
        imageInput.value = '';
    };
}

// Display image preview
function displayImagePreview(imageData, index) {
    const container = document.getElementById('image-preview-container');
    
    const previewItem = document.createElement('div');
    previewItem.className = 'image-preview-item';
    previewItem.innerHTML = `
        <img src="${imageData.data}" alt="${imageData.name}">
        <button class="remove-image-btn" onclick="removeImage(${index})">&times;</button>
        <div style="padding: 5px; font-size: 0.75rem; background: rgba(0,0,0,0.7); color: white; text-align: center;">
            ${(imageData.size / 1024).toFixed(0)}KB
        </div>
    `;
    
    container.appendChild(previewItem);
}

// Remove image from attachments
function removeImage(index) {
    window.replyImages.splice(index, 1);
    
    // Re-render previews
    const container = document.getElementById('image-preview-container');
    container.innerHTML = '';
    
    window.replyImages.forEach((img, i) => {
        displayImagePreview(img, i);
    });
}

// Submit reply
function submitReply() {
    const replyText = document.getElementById('reply-text').value.trim();
    
    if (!replyText) {
        alert('⚠️ Please enter a reply message');
        return;
    }
    
    if (!window.currentReplyMessageId) {
        alert('⚠️ Error: No message selected');
        return;
    }
    
    // Disable send button while processing
    const sendBtn = document.querySelector('.btn-send-reply');
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    // Send reply with images
    sendReply(window.currentReplyMessageId, replyText, window.replyImages);
}

// Send reply (old function - now removed, replaced above)
// The new openReplyModal function replaces this

// Send reply
function sendReply(messageId, reply, images = []) {
    let messages = JSON.parse(localStorage.getItem('contactMessages')) || [];
    const messageIndex = messages.findIndex(m => m.messageId === messageId);
    
    if (messageIndex !== -1) {
        const message = messages[messageIndex];
        
        // Update message status
        messages[messageIndex].status = 'Replied';
        messages[messageIndex].reply = reply;
        messages[messageIndex].replyImages = images;
        messages[messageIndex].replyDate = new Date().toISOString();
        messages[messageIndex].replyDateFormatted = new Date().toLocaleString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        localStorage.setItem('contactMessages', JSON.stringify(messages));
        
        // Send email notification to customer
        sendEmailReply(message, reply, images);
        
        loadMessages(currentFilter);
        loadDashboardData();
        updateUnreadBadge();
        
        closeReplyModal();
    }
}

// Function to compress image to reduce size
function compressImage(base64Str, maxWidth = 300, quality = 0.4) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Resize if too large
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG with quality setting
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
        };
        img.src = base64Str;
    });
}

// Send email reply to customer
async function sendEmailReply(message, reply, images = []) {
    // Check if EmailJS is configured
    try {
        emailjs.init("MBiJ9GgH8vWVNX61M");
    } catch(e) {
        console.log('EmailJS not configured, skipping email send');
        return;
    }
    
    // Compress and prepare image HTML for email
    let imagesHtml = '';
    if (images && images.length > 0) {
        console.log('Compressing images...');
        const compressedImages = [];
        
        for (let img of images) {
            try {
                const compressed = await compressImage(img.data, 300, 0.4);
                compressedImages.push(compressed);
            } catch (err) {
                console.error('Image compression failed:', err);
            }
        }

        if (compressedImages.length > 0) {
            imagesHtml = '<div style="margin-top: 20px;"><strong>Attached Images:</strong><br><br>';
            compressedImages.forEach((imgData, index) => {
                imagesHtml += `<img src="${imgData}" alt="Attachment ${index + 1}" style="max-width: 300px; margin: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">`;
            });
            imagesHtml += '</div>';
        }
    }
    
    const templateParams = {
        to_email: message.email,
        to_name: message.name,
        from_name: "4D Signs Customer Support",
        subject: `Re: ${message.subject}`,
        original_message: message.message,
        reply_message: reply,
        customer_name: message.name,
        images_html: imagesHtml,
        has_images: images.length > 0 ? 'yes' : 'no'
    };
    
    // Show sending notification
    const notification = document.createElement('div');
    notification.className = 'email-notification';
    notification.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending email to customer...';
    document.body.appendChild(notification);
    
    emailjs.send("service_omyj3ii", "template_k5cwcj8", templateParams)
        .then(function(response) {
            console.log('✅ Email sent successfully!', response);
            notification.className = 'email-notification success';
            notification.innerHTML = `<i class="fas fa-check-circle"></i> ✅ Reply sent successfully to ${message.email}${images.length > 0 ? ' (with ' + images.length + ' image(s))' : ''}`;
            setTimeout(() => notification.remove(), 4000);
        }, function(error) {
            console.error('❌ Email send failed:', error);
            console.log('Template params sent:', templateParams);
            notification.className = 'email-notification error';
            notification.innerHTML = `<i class="fas fa-exclamation-circle"></i> ⚠️ Reply saved but email failed: ${error.text || error.message || 'Unknown error'}`;
            setTimeout(() => notification.remove(), 6000);
        });
}

// Delete message
function deleteMessage(messageId) {
    if (confirm('Are you sure you want to delete this message?')) {
        let messages = JSON.parse(localStorage.getItem('contactMessages')) || [];
        messages = messages.filter(m => m.messageId !== messageId);
        localStorage.setItem('contactMessages', JSON.stringify(messages));
        loadMessages(currentFilter);
        loadDashboardData();
        updateUnreadBadge();
        alert('Message deleted successfully!');
    }
}

// Update unread badge
function updateUnreadBadge() {
    const messages = JSON.parse(localStorage.getItem('contactMessages')) || [];
    const unreadCount = messages.filter(m => m.status === 'Unread').length;
    const badge = document.getElementById('unread-count');
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

