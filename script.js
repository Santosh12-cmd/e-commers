// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Global variables
let products = [];
let cart = [];
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// Authentication functions
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showNotification('Login successful!', 'success');
            updateUIForLoggedInUser();
            return true;
        } else {
            showNotification(data.message || 'Login failed', 'error');
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
        return false;
    }
}

async function register(name, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showNotification('Registration successful!', 'success');
            updateUIForLoggedInUser();
            return true;
        } else {
            showNotification(data.message || 'Registration failed', 'error');
            return false;
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again.', 'error');
        return false;
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    cart = [];
    updateCartCount();
    showNotification('Logged out successfully', 'info');
    updateUIForLoggedOutUser();
}

// API helper function
async function apiCall(endpoint, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        ...options
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API call failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Product functions
async function loadProducts() {
    try {
        showLoadingState('featuredProducts');
        showLoadingState('allProducts');
        
        const response = await fetch(`${API_BASE_URL}/products`);
        if (response.ok) {
            products = await response.json();
            loadFeaturedProducts();
            loadAllProducts();
        } else {
            console.error('Failed to load products');
            loadMockProducts();
        }
    } catch (error) {
        console.error('Error loading products:', error);
        loadMockProducts();
    }
}

function showLoadingState(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="loading">Loading products...</div>';
    }
}

// Mock products fallback
function loadMockProducts() {
    products = [
        {
            id: "1",
            name: "Sony WH-1000XM4 Wireless Headphones",
            price: 348.00,
            description: "Industry-leading noise canceling with Dual Noise Sensor technology. Up to 30-hour battery life with quick charge.",
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            category: "Electronics",
            stock: 50,
            rating: 4.8,
            reviews: []
        },
        {
            id: "2",
            name: "Apple Watch Series 9",
            price: 399.00,
            description: "Advanced health monitoring, ECG app, and blood oxygen measurement. Now with faster charging.",
            image: "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            category: "Electronics",
            stock: 30,
            rating: 4.9,
            reviews: []
        },
        {
            id: "3",
            name: "Nike Air Max Running Shoes",
            price: 129.99,
            description: "Comfortable running shoes with Air Max cushioning for daily exercise and casual wear.",
            image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
            category: "Sports",
            stock: 25,
            rating: 4.7,
            reviews: []
        }
    ];
    loadFeaturedProducts();
    loadAllProducts();
}

// Load products on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser && authToken) {
        currentUser = JSON.parse(savedUser);
        updateUIForLoggedInUser();
        loadCartFromServer();
    } else {
        updateUIForLoggedOutUser();
    }
    
    loadProducts();
    updateCartCount();
    
    // Add scroll effect to navbar
    window.addEventListener('scroll', function() {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Add auth modal to the page
    addAuthModal();
});

// Navigation functions
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    
    if (pageId === 'products') {
        loadAllProducts();
    }
    
    window.scrollTo(0, 0);
}

// Product loading functions
function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    const featuredProducts = products.slice(0, 6);
    container.innerHTML = featuredProducts.map(product => createProductCard(product)).join('');
}

function loadAllProducts() {
    const container = document.getElementById('allProducts');
    container.innerHTML = products.map(product => createProductCard(product)).join('');
}

function createProductCard(product) {
    const productName = product.name || product.title;
    const productPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price);
    
    return `
        <div class="product-card">
            <div class="product-image" onclick="viewProduct('${product.id}')">
                <img src="${product.image}" alt="${productName}" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-title" onclick="viewProduct('${product.id}')">${productName}</h3>
                <div class="product-rating">
                    <div class="stars">
                        ${'★'.repeat(Math.floor(product.rating || 4.5))}${'☆'.repeat(5 - Math.floor(product.rating || 4.5))}
                    </div>
                    <span class="rating-text">${product.rating || 4.5} (${(product.reviews && product.reviews.length) || 0} reviews)</span>
                </div>
                <div class="product-price">
                    $${productPrice.toFixed(2)}
                </div>
                <p class="product-description">${product.description}</p>
                <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `;
}

// Cart functions with backend integration
async function addToCart(productId) {
    if (!authToken) {
        showNotification('Please login to add items to cart', 'error');
        showAuthModal('login');
        return;
    }

    try {
        await apiCall('/cart/add', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity: 1 })
        });

        const product = products.find(p => p.id === productId);
        const productName = product ? (product.name || product.title) : 'Product';
        showNotification(`${productName} added to cart!`, 'success');
        
        await loadCartFromServer();
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Failed to add item to cart', 'error');
    }
}

async function loadCartFromServer() {
    if (!authToken) {
        cart = [];
        updateCartCount();
        return;
    }

    try {
        const response = await apiCall('/cart');
        cart = response.items || [];
        updateCartCount();
    } catch (error) {
        console.error('Error loading cart:', error);
        cart = [];
        updateCartCount();
    }
}

async function updateQuantity(productId, change) {
    if (!authToken) return;

    try {
        const cartItem = cart.find(item => item.productId === productId);
        if (!cartItem) return;

        const newQuantity = cartItem.quantity + change;
        
        if (newQuantity <= 0) {
            await removeFromCart(productId);
        } else {
            await apiCall(`/cart/update/${cartItem.id}`, {
                method: 'PUT',
                body: JSON.stringify({ quantity: newQuantity })
            });
            await loadCartFromServer();
            displayCartItems();
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        showNotification('Failed to update quantity', 'error');
    }
}

async function removeFromCart(productId) {
    if (!authToken) return;

    try {
        const cartItem = cart.find(item => item.productId === productId);
        if (!cartItem) return;

        await apiCall(`/cart/remove/${cartItem.id}`, {
            method: 'DELETE'
        });

        await loadCartFromServer();
        displayCartItems();
        showNotification('Item removed from cart', 'info');
    } catch (error) {
        console.error('Error removing from cart:', error);
        showNotification('Failed to remove item', 'error');
    }
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = totalItems;
}

function openCart() {
    if (!authToken) {
        showNotification('Please login to view your cart', 'error');
        showAuthModal('login');
        return;
    }
    
    displayCartItems();
    document.getElementById('cartModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    document.getElementById('cartModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function displayCartItems() {
    const container = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Add some amazing products to get started!</p>
            </div>
        `;
        document.getElementById('totalAmount').textContent = '0.00';
        return;
    }

    container.innerHTML = cart.map(item => {
        const product = item.product;
        if (!product) return '';
        
        const productName = product.name || product.title;
        const productPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price);
        
        return `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${product.image}" alt="${productName}">
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-title">${productName}</div>
                    <div class="cart-item-price">$${productPrice.toFixed(2)} each</div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity('${item.productId}', -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span style="margin: 0 1rem; font-weight: 600; min-width: 60px; text-align: center;">Qty: ${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity('${item.productId}', 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="remove-btn" onclick="removeFromCart('${item.productId}')">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                    <div style="color: #2563eb; font-weight: 600; margin-top: 0.5rem;">
                        Subtotal: $${(productPrice * item.quantity).toFixed(2)}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    updateCartTotal();
}

function updateCartTotal() {
    const total = cart.reduce((sum, item) => {
        const product = item.product;
        if (!product) return sum;
        const productPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price);
        return sum + (productPrice * item.quantity);
    }, 0);
    document.getElementById('totalAmount').textContent = total.toFixed(2);
}

async function checkout() {
    if (!authToken) {
        showNotification('Please login to checkout', 'error');
        showAuthModal('login');
        return;
    }

    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }

    try {
        const orderData = {
            shippingAddress: "123 Main St, City, State, ZIP",
            paymentMethod: "credit_card"
        };

        await apiCall('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });

        showNotification('Order placed successfully! Thank you for shopping with us.', 'success');
        
        // Clear cart and close modal
        cart = [];
        updateCartCount();
        closeCart();
        
    } catch (error) {
        console.error('Checkout error:', error);
        showNotification('Checkout failed. Please try again.', 'error');
    }
}

// Search and filter functions
async function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;

    try {
        let url = `${API_BASE_URL}/products?`;
        if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
        if (categoryFilter) url += `category=${encodeURIComponent(categoryFilter)}&`;
        
        const response = await fetch(url);
        if (response.ok) {
            let filteredProducts = await response.json();
            
            // Apply price filter on frontend
            if (priceFilter) {
                filteredProducts = filteredProducts.filter(product => {
                    const price = typeof product.price === 'number' ? product.price : parseFloat(product.price);
                    switch (priceFilter) {
                        case '0-100': return price <= 100;
                        case '100-300': return price > 100 && price <= 300;
                        case '300-1000': return price > 300 && price <= 1000;
                        case '1000+': return price > 1000;
                        default: return true;
                    }
                });
            }
            
            displayFilteredProducts(filteredProducts);
        }
    } catch (error) {
        console.error('Error filtering products:', error);
    }
}

function displayFilteredProducts(filteredProducts) {
    const container = document.getElementById('allProducts');
    
    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; grid-column: 1 / -1; padding: 3rem;">
                <i class="fas fa-search" style="font-size: 3rem; color: #d1d5db; margin-bottom: 1rem;"></i>
                <h3 style="color: #6b7280; margin-bottom: 0.5rem;">No products found</h3>
                <p style="color: #9ca3af;">Try adjusting your search or filter criteria</p>
            </div>
        `;
    } else {
        container.innerHTML = filteredProducts.map(product => createProductCard(product)).join('');
    }
}

// Authentication Modal
function addAuthModal() {
    const authModalHTML = `
        <div id="authModal" class="modal">
            <div class="modal-content" style="max-width: 400px;">
                <span class="close" onclick="closeAuthModal()">
                    <i class="fas fa-times"></i>
                </span>
                <div id="authContent">
                    <!-- Login Form -->
                    <div id="loginForm">
                        <h2 style="margin-bottom: 1.5rem; text-align: center;">
                            <i class="fas fa-sign-in-alt"></i> Login
                        </h2>
                        <form onsubmit="handleLogin(event)">
                            <input type="email" id="loginEmail" placeholder="Email" required 
                                   style="width: 100%; padding: 12px; margin-bottom: 1rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
                            <input type="password" id="loginPassword" placeholder="Password" required 
                                   style="width: 100%; padding: 12px; margin-bottom: 1.5rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
                            <button type="submit" class="btn" style="width: 100%; margin-bottom: 1rem;">
                                <i class="fas fa-sign-in-alt"></i> Login
                            </button>
                        </form>
                        <p style="text-align: center; color: #6b7280;">
                            Don't have an account? 
                            <a href="#" onclick="showRegisterForm()" style="color: #2563eb; text-decoration: none;">Register here</a>
                        </p>
                    </div>

                    <!-- Register Form -->
                    <div id="registerForm" style="display: none;">
                        <h2 style="margin-bottom: 1.5rem; text-align: center;">
                            <i class="fas fa-user-plus"></i> Register
                        </h2>
                        <form onsubmit="handleRegister(event)">
                            <input type="text" id="registerName" placeholder="Full Name" required 
                                   style="width: 100%; padding: 12px; margin-bottom: 1rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
                            <input type="email" id="registerEmail" placeholder="Email" required 
                                   style="width: 100%; padding: 12px; margin-bottom: 1rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
                            <input type="password" id="registerPassword" placeholder="Password" required 
                                   style="width: 100%; padding: 12px; margin-bottom: 1.5rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem;">
                            <button type="submit" class="btn" style="width: 100%; margin-bottom: 1rem;">
                                <i class="fas fa-user-plus"></i> Register
                            </button>
                        </form>
                        <p style="text-align: center; color: #6b7280;">
                            Already have an account? 
                            <a href="#" onclick="showLoginForm()" style="color: #2563eb; text-decoration: none;">Login here</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', authModalHTML);
}

function showAuthModal(type = 'login') {
    document.getElementById('authModal').style.display = 'block';
    if (type === 'login') {
        showLoginForm();
    } else {
        showRegisterForm();
    }
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const success = await login(email, password);
    if (success) {
        closeAuthModal();
        await loadCartFromServer();
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    const success = await register(name, email, password);
    if (success) {
        closeAuthModal();
        await loadCartFromServer();
    }
}

// UI Updates for authentication
function updateUIForLoggedInUser() {
    // Add logout button to navigation
    const navActions = document.querySelector('.nav-actions');
    
    // Remove login button if exists
    const existingLoginBtn = document.getElementById('loginBtn');
    if (existingLoginBtn) {
        existingLoginBtn.remove();
    }
    
    // Add user menu
    const userMenuHTML = `
        <div class="user-menu" style="display: flex; align-items: center; gap: 1rem; margin-right: 1rem;">
            <span style="color: #e2e8f0; font-weight: 500;">Hello, ${currentUser.name}!</span>
            <button onclick="logout()" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        </div>
    `;
    
    navActions.insertAdjacentHTML('afterbegin', userMenuHTML);
}

function updateUIForLoggedOutUser() {
    // Remove user menu if exists
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.remove();
    }
    
    // Add login button
    const navActions = document.querySelector('.nav-actions');
    const loginBtnHTML = `
        <button id="loginBtn" onclick="showAuthModal('login')" 
                style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500; margin-right: 1rem;">
            <i class="fas fa-sign-in-alt"></i> Login
        </button>
    `;
    
    navActions.insertAdjacentHTML('afterbegin', loginBtnHTML);
}

// Product view function
function viewProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        const productName = product.name || product.title;
        const productPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price);
        
        alert(`${productName}\n\nPrice: $${productPrice.toFixed(2)}\nRating: ${product.rating || 4.5}★\nCategory: ${product.category}\n\nDescription: ${product.description}\n\n✨ Click "Add to Cart" to purchase this item!`);
    }
}

// Enhanced notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };
    
    const colors = {
        success: 'linear-gradient(135deg, #10b981, #059669)',
        error: 'linear-gradient(135deg, #ef4444, #dc2626)',
        info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
    };
    
    notification.style.background = colors[type] || colors.success;
    notification.innerHTML = `
        <i class="${icons[type] || icons.success}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Close modals when clicking outside
window.onclick = function(event) {
    const cartModal = document.getElementById('cartModal');
    const authModal = document.getElementById('authModal');
    
    if (event.target === cartModal) {
        closeCart();
    }
    if (event.target === authModal) {
        closeAuthModal();
    }
}

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeCart();
        closeAuthModal();
    }
});