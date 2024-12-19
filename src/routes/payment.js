const express = require('express');
const routes = express.Router();
const auth = require('../middlewares/user_authentication');
const controllers = require('../controllers/payment_controller');

routes.post('/razorpay/order', auth.authenticateUserApi, controllers.create_payment);
routes.post('/razorpay/verify-payment', auth.authenticateUserApi, controllers.verify_payment);

module.exports = routes;