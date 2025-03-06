const express = require('express');
const router = express.Router();
const { getAllOrders } = require('../controllers/order.controller');

router.get('/orders', getAllOrders);

module.exports = router;
