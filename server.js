// server.js - Complete Express server for Week 2 assignment

// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.json());
app.use(morgan('dev')); // HTTP request logger

// Custom middleware for request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Authentication middleware (simplified for demo)
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
  }
  // In real app, verify JWT token here
  next();
};

// Validation middleware
const validateProduct = (req, res, next) => {
  const { name, price } = req.body;
  
  if (!name || !price) {
    return res.status(400).json({
      success: false,
      error: 'Name and price are required',
      code: 'VALIDATION_ERROR'
    });
  }
  
  if (isNaN(price) || price <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Price must be a positive number',
      code: 'VALIDATION_ERROR'
    });
  }
  
  next();
};

// Sample in-memory products database
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    price: 1200,
    category: 'electronics',
    inStock: true
  },
  {
    id: '2',
    name: 'Smartphone',
    description: 'Latest model with 128GB storage',
    price: 800,
    category: 'electronics',
    inStock: true
  },
  {
    id: '3',
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer',
    price: 50,
    category: 'kitchen',
    inStock: false
  }
];

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Product API! Go to /api/products to see all products.');
});

// GET /api/products - Get all products with filtering
app.get('/api/products', (req, res) => {
  // Filtering
  let result = [...products];
  const { name, category, minPrice, maxPrice, inStock } = req.query;
  
  if (name) {
    result = result.filter(p => 
      p.name.toLowerCase().includes(name.toLowerCase())
    );
  }
  
  if (category) {
    result = result.filter(p => 
      p.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  if (minPrice) {
    result = result.filter(p => p.price >= parseFloat(minPrice));
  }
  
  if (maxPrice) {
    result = result.filter(p => p.price <= parseFloat(maxPrice));
  }
  
  if (inStock) {
    result = result.filter(p => p.inStock === (inStock.toLowerCase() === 'true'));
  }
  
  res.json({
    success: true,
    count: result.length,
    data: result
  });
});

// GET /api/products/:id - Get a specific product
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Product not found',
      code: 'NOT_FOUND'
    });
  }
  
  res.json({
    success: true,
    data: product
  });
});

// POST /api/products - Create a new product
app.post('/api/products', authenticate, validateProduct, (req, res) => {
  const newProduct = {
    id: uuidv4(),
    ...req.body,
    inStock: req.body.inStock || false
  };
  
  products.push(newProduct);
  
  res.status(201).json({
    success: true,
    data: newProduct
  });
});

// PUT /api/products/:id - Update a product
app.put('/api/products/:id', authenticate, validateProduct, (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Product not found',
      code: 'NOT_FOUND'
    });
  }
  
  const updatedProduct = {
    ...products[index],
    ...req.body
  };
  
  products[index] = updatedProduct;
  
  res.json({
    success: true,
    data: updatedProduct
  });
});

// DELETE /api/products/:id - Delete a product
app.delete('/api/products/:id', authenticate, (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Product not found',
      code: 'NOT_FOUND'
    });
  }
  
  products = products.filter(p => p.id !== req.params.id);
  
  res.json({
    success: true,
    data: {}
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'SERVER_ERROR'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing purposes
module.exports = app;