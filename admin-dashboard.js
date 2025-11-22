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
    loadOrders();
    loadCustomers();
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
    // Get products from page
    const products = getProductsFromPage();
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
        totalRevenue += order.total || 0;
    });
    document.getElementById('total-revenue').textContent = '₱' + totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 });
    
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
            customer.totalSpent += order.total || 0;
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
    
    activityList.innerHTML = recentOrders.map(order => `
        <div style="padding: 12px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="color: #1e293b;">${order.orderId}</strong>
                <p style="font-size: 0.9rem; color: #64748b; margin: 4px 0 0 0;">${order.customer.name} - ${order.orderDateFormatted}</p>
            </div>
            <div style="text-align: right;">
                <strong style="color: #059669;">₱${order.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
                <p style="font-size: 0.85rem; color: #f59e0b; margin: 4px 0 0 0;">${order.status}</p>
            </div>
        </div>
    `).join('');
}

// Get products from the main page
function getProductsFromPage() {
    return [
        { name: 'Giveaways', price: '₱100.00 - ₱400.00', stock: 30, reviews: 98, image: 'ProductPics/Giveaways.jpg' },
        { name: 'Bulk Packages', price: '₱1,000.00 - ₱5,000.00', stock: 15, reviews: 54, image: '' },
        { name: 'Custom Signage', price: '₱500.00 - ₱3,000.00', stock: 50, reviews: 120, image: '' },
        { name: 'Banners', price: '₱300.00 - ₱1,500.00', stock: 80, reviews: 89, image: '' },
        { name: 'Stickers & Decals', price: '₱50.00 - ₱300.00', stock: 150, reviews: 142, image: 'ProductPics/Sticker.jpg' },
        { name: 'Custom Mugs', price: '₱250.00 - ₱600.00', stock: 60, reviews: 88, image: 'ProductPics/Mugs.jpg' },
        { name: 'T-Shirt Printing', price: '₱350.00 - ₱800.00', stock: 100, reviews: 156, image: '' },
        { name: 'Keychains', price: '₱80.00 - ₱250.00', stock: 200, reviews: 201, image: 'ProductPics/keychain.jpg' },
        { name: 'Invitations', price: '₱200.00 - ₱800.00', stock: 90, reviews: 75, image: '' },
        { name: 'Calling Cards', price: '₱150.00 - ₱500.00', stock: 120, reviews: 93, image: '' },
        { name: 'Pabitin', price: '₱800.00 - ₱2,500.00', stock: 35, reviews: 67, image: 'ProductPics/Pabitin.jpg' },
        { name: 'Party Hats', price: '₱150.00 - ₱500.00', stock: 120, reviews: 134, image: 'ProductPics/PartyHats.jpg' }
    ];
}

// Load Products Table
function loadProducts() {
    const products = getProductsFromPage();
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
            <td>${product.price}</td>
            <td><span style="color: ${product.stock > 50 ? '#22c55e' : product.stock > 20 ? '#f59e0b' : '#ef4444'};">${product.stock} items</span></td>
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

// Edit Product
function editProduct(productName) {
    alert(`Edit functionality for "${productName}" - Coming soon!`);
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
    
    tableBody.innerHTML = sortedOrders.map(order => `
        <tr>
            <td><strong>${order.orderId}</strong></td>
            <td>${order.customer.name}<br><small style="color: #64748b;">${order.customer.email}</small></td>
            <td>${order.items.map(item => `${item.name} (x${item.quantity || 1})`).join(', ')}</td>
            <td>${order.items.reduce((sum, item) => sum + (item.quantity || 1), 0)} items</td>
            <td><strong>₱${order.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></td>
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
    `).join('');
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
    
    const itemsList = order.items.map(item => 
        `- ${item.name} (${item.color || item.design || 'N/A'}, ${item.size || 'N/A'}) x${item.quantity || 1} = ₱${((parseFloat(item.price.replace('₱', '').replace(',', '')) || 0) * (item.quantity || 1)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
    ).join('\n');
    
    alert(`ORDER DETAILS\n\nOrder ID: ${order.orderId}\nDate: ${order.orderDateFormatted}\nStatus: ${order.status}\n\nCUSTOMER:\nName: ${order.customer.name}\nEmail: ${order.customer.email}\nPhone: ${order.customer.phone}\nAddress: ${order.customer.fullAddress}\n\nDELIVERY METHOD:\n${order.customer.deliveryMethod === 'delivery' ? 'Delivery' : 'Pick-up'}\n\nPAYMENT METHOD:\n${order.customer.paymentMethod}\n\nITEMS:\n${itemsList}\n\nSubtotal: ₱${order.subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}\nShipping: ₱${order.shipping.toLocaleString('en-PH', { minimumFractionDigits: 2 })}\nTOTAL: ₱${order.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`);
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

