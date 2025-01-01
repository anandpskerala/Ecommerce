const express = require('express');
const routes = express.Router();
const auth = require('../middlewares/user_authentication');
const controllers = require('../controllers/payment_controller');

routes.post('/razorpay/order', auth.authenticateUserApi, controllers.create_payment);
routes.post('/razorpay/verify-payment', auth.authenticateUserApi, controllers.verify_payment);
routes.post('/razorpay/retry-payment', auth.authenticateUserApi, controllers.retry_payment);
routes.patch('/razorpay/set-payment-status', auth.authenticateUserApi, controllers.set_payment_status);

module.exports = routes;