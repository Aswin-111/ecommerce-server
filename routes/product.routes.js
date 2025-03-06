const express = require('express');
const router = express.Router();
const products = require('../controllers/product.controller.js');

// Create a new Product
router.post('/', products.create);

// Retrieve all Products
router.get('/', products.findAll);

// Retrieve a single Product with id
router.get('/:id', products.findOne);

// Update a Product with id
router.put('/:id', products.update);

// Delete a Product with id
router.delete('/:id', products.delete);

module.exports = router;
