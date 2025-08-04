const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:8080'],
    credentials: true
}));
app.use(express.json());

// In-memory database (replace with actual database in production)
let users = [];
let products = [
  {
    id: '1',
    name: 'Sony WH-1000XM4 Wireless Headphones',
    price: 348.00,
    description: 'Industry-leading noise canceling with Dual Noise Sensor technology. Up to 30-hour battery life with quick charge.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    category: 'Electronics',
    stock: 50,
    rating: 4.8,
    reviews: []
  },
  {
    id: '2',
    name: 'Apple Watch Series 9',
    price: 399.99,
    description: 'Advanced health monitoring, ECG app, and blood oxygen measurement. Now with faster charging.',
    image: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    category: 'Electronics',
    stock: 30,
    rating: 4.9,
    reviews: []
  },
  {
    id: '3',
    name: 'Nike Air Max Running Shoes',
    price: 129.99,
    description: 'Comfortable running shoes with Air Max cushioning for daily exercise and casual wear.',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    category: 'Sports',
    stock: 25,
    rating: 4.7,
    reviews: []
  },
  {
    id: '4',
    name: 'MacBook Pro 16-inch',
    price: 2399.00,
    description: 'Powerful laptop with M3 Pro chip, 16-inch Liquid Retina XDR display, and all-day battery life.',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    category: 'Electronics',
    stock: 15,
    rating: 4.9,
    reviews: []
  },
  {
    id: '5',
    name: 'Yoga Mat Premium',
    price: 89.99,
    description: 'Non-slip yoga mat with superior grip and cushioning. Perfect for all types of yoga practice.',
    image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    category: 'Sports',
    stock: 40,
    rating: 4.6,
    reviews: []
  },
  {
    id: '6',
    name: 'Coffee Maker Deluxe',
    price: 299.99,
    description: 'Professional-grade coffee maker with programmable settings and thermal carafe.',
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    category: 'Home',
    stock: 20,
    rating: 4.5,
    reviews: []
  }
];
let orders = [];
let carts = {}; // userId: { items: [...] }

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      createdAt: new Date()
    };
    
    users.push(user);
    carts[user.id] = { items: [] };

    // Generate token
    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET);
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user.id, email, name }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET);
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Product Routes
app.get('/api/products', (req, res) => {
  const { category, search, minPrice, maxPrice } = req.query;
  let filteredProducts = [...products];

  if (category) {
    filteredProducts = filteredProducts.filter(p => 
      p.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (search) {
    filteredProducts = filteredProducts.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (minPrice) {
    filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice));
  }

  if (maxPrice) {
    filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice));
  }

  res.json(filteredProducts);
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});

// Shopping Cart Routes
app.get('/api/cart', authenticateToken, (req, res) => {
  const userCart = carts[req.user.userId] || { items: [] };
  
  // Populate cart items with product details
  const populatedItems = userCart.items.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      ...item,
      product: product || null
    };
  });

  res.json({ items: populatedItems });
});

app.post('/api/cart/add', authenticateToken, (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const userId = req.user.userId;

  // Check if product exists
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // Check stock
  if (product.stock < quantity) {
    return res.status(400).json({ message: 'Insufficient stock' });
  }

  // Initialize cart if doesn't exist
  if (!carts[userId]) {
    carts[userId] = { items: [] };
  }

  // Check if item already in cart
  const existingItem = carts[userId].items.find(item => item.productId === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    carts[userId].items.push({
      id: uuidv4(),
      productId,
      quantity,
      addedAt: new Date()
    });
  }

  res.json({ message: 'Item added to cart', cart: carts[userId] });
});

app.put('/api/cart/update/:itemId', authenticateToken, (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.userId;

  if (!carts[userId]) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  const item = carts[userId].items.find(item => item.id === itemId);
  if (!item) {
    return res.status(404).json({ message: 'Item not found in cart' });
  }

  if (quantity <= 0) {
    carts[userId].items = carts[userId].items.filter(item => item.id !== itemId);
  } else {
    item.quantity = quantity;
  }

  res.json({ message: 'Cart updated', cart: carts[userId] });
});

app.delete('/api/cart/remove/:itemId', authenticateToken, (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.userId;

  if (!carts[userId]) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  carts[userId].items = carts[userId].items.filter(item => item.id !== itemId);
  
  res.json({ message: 'Item removed from cart', cart: carts[userId] });
});

app.delete('/api/cart/clear', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  carts[userId] = { items: [] };
  
  res.json({ message: 'Cart cleared' });
});

// Order Processing Routes
app.post('/api/orders', authenticateToken, (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;
  const userId = req.user.userId;

  if (!carts[userId] || carts[userId].items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  // Calculate order total and validate stock
  let total = 0;
  const orderItems = [];

  for (const cartItem of carts[userId].items) {
    const product = products.find(p => p.id === cartItem.productId);
    if (!product) {
      return res.status(400).json({ message: `Product ${cartItem.productId} not found` });
    }

    if (product.stock < cartItem.quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
      });
    }

    const itemTotal = product.price * cartItem.quantity;
    total += itemTotal;

    orderItems.push({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: cartItem.quantity,
      total: itemTotal
    });
  }

  // Create order
  const order = {
    id: uuidv4(),
    userId,
    items: orderItems,
    total,
    shippingAddress: shippingAddress || "123 Main St, City, State, ZIP",
    paymentMethod: paymentMethod || "credit_card",
    status: 'pending',
    createdAt: new Date()
  };

  orders.push(order);

  // Update product stock
  for (const cartItem of carts[userId].items) {
    const product = products.find(p => p.id === cartItem.productId);
    product.stock -= cartItem.quantity;
  }

  // Clear cart
  carts[userId] = { items: [] };

  res.status(201).json({
    message: 'Order placed successfully',
    order
  });
});

app.get('/api/orders', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const userOrders = orders.filter(order => order.userId === userId);
  
  res.json(userOrders);
});

app.get('/api/orders/:id', authenticateToken, (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.userId;
  
  const order = orders.find(o => o.id === orderId && o.userId === userId);
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  
  res.json(order);
});

// Categories Route
app.get('/api/categories', (req, res) => {
  const categories = [...new Set(products.map(p => p.category))];
  res.json(categories);
});

// Search Route
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ message: 'Search query required' });
  }

  const results = products.filter(product =>
    product.name.toLowerCase().includes(q.toLowerCase()) ||
    product.description.toLowerCase().includes(q.toLowerCase()) ||
    product.category.toLowerCase().includes(q.toLowerCase())
  );

  res.json(results);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📦 Products: ${products.length} items loaded`);
});

module.exports = app;