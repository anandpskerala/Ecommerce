const express = require('express');	
const mongoose = require('mongoose');
const auth = require('../middlewares/user_authentication');
const controllers = require('../controllers/profile_controller');
const user_model = require('../models/user_model');
const cart_model = require('../models/cart_model');
const order_model = require('../models/order_model');
const payment_model = require('../models/payment_model');
const multer = require('../utils/multer');
const time = require('../utils/time');

const routes = express.Router();


routes.get("/verify-otp", (req, res) => {
    if (!req.session.otp) {
        return res.redirect('/forgot-password');
    }
    try {
        const error_message = req.session.error || null;
        req.session.error = null;
        return res.render('user/verify_otp', {title: "Verify OTP", error_message, session: req.session.otp});
    } catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
});

routes.get("/verify-signup", (req, res) => {
    console.log(req.session)
    if (!req.session.otp) {
        return res.redirect('/signup');
    }
    try {
        const error_message = req.session.error || null;
        req.session.error = null;
        return res.render('user/verify_signup', {title: "Verify OTP", error_message, session: req.session.otp});
    } catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
});

routes.get("/reset-password", (req, res) => {
    try {
        const error_message = req.session.error || null;
        req.session.error = null;
        return res.render('user/reset_password', {title: "Reset Password", error_message});
    } catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
});

routes.get("/account", auth.authenticateUser, async (req, res) => {
    try {
        const error_message = req.session.error || null;
        req.session.error = null;
        const user = await user_model.findOne({_id: req.session.user.id});
        return res.render('user/account_page', {title: "Account", error_message, user});
    } catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
});

routes.get("/orders", auth.authenticateUser, async (req, res) => {
    try {
        const error_message = req.session.error || null;
        req.session.error = null;
        const orders = await order_model.find({user_id: req.session.user.id});
        return res.render('user/order_page', {title: "Orders", error_message, orders, time});
    } catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
})

routes.get("/change-password", auth.authenticateUser, (req, res) => {
    return res.render('user/change_password', {title: "Change Password"});
});

routes.get("/carts", auth.authenticateUser, async (req, res) => {
    const carts = await cart_model.find({user: req.session.user.id})
    const result = await cart_model.aggregate([
        {
            $match: { user: new mongoose.Types.ObjectId(req.session.user.id) }
        },
        {
            $group: {
                _id: null,
                totalPrice: { $sum: { $multiply: ["$price", "$quantity"] } }
            }
        }
    ]);
    const total_price = result.length > 0 ? result[0].totalPrice : 0;
    return res.render('user/cart_page', {title: "Cart", carts, total_price});
});

routes.get("/manage-address", auth.authenticateUser, async (req, res) => {
    const user = await user_model.findOne({_id: req.session.user.id});
    return res.render('user/address', {title: "Address", user});
});

routes.get("/checkout", auth.authenticateUser, async (req, res) => {
    const carts = await cart_model.find({user: req.session.user.id});
    const user = await user_model.findOne({_id: req.session.user.id});
    const result = await cart_model.aggregate([
        {
            $match: { user: new mongoose.Types.ObjectId(req.session.user.id) }
        },
        {
            $group: {
                _id: null,
                totalPrice: { $sum: { $multiply: ["$price", "$quantity"] } }
            }
        }
    ]);
    const total_price = result.length > 0 ? result[0].totalPrice : 0;
    if (carts && carts.length > 0) {
        return res.render('user/checkout_page', {title: "Check Out", user, carts, total_price});
    } else {
        return res.redirect('/user/carts');
    }
});

routes.get("/order-summary/:id", auth.authenticateUser, async (req, res) => {
    const {id} = req.params;
    const payment = await payment_model.findOne({_id: id});
    if (!payment) {
        return res.redirect("/user/orders");
    }
    let orders = [];
    for (const order of payment.orders) {
        const product_order = await order_model.findOne({_id: order});
        orders.push(product_order);
    }
    const user = await user_model.findOne({_id: req.session.user.id});
    const address = user.addresses.find(v => v._id.toString() == orders[0].address.toString());
    console.log(address)
    return res.render('user/order_summary', {title: "Order Summary", payment, orders, time, user, address});
});


routes.post("/send-otp", controllers.send_otp);
routes.post("/verify-otp", controllers.verify_otp);
routes.post("/verify-signup", controllers.verify_signup);
routes.post("/reset-password", controllers.reset_password);

routes.post("/change-password", auth.authenticateUserApi, controllers.change_password);
routes.post("/change-profile-picture", auth.authenticateUserApi, multer.single("image"), controllers.change_profile_picture);
routes.delete("/remove-profile-image", auth.authenticateUserApi, controllers.remove_profile_picture);
routes.patch("/change-phone", auth.authenticateUserApi, controllers.change_phone);
routes.post("/add-address", auth.authenticateUserApi, controllers.add_address);
routes.delete("/delete-address", auth.authenticateUserApi, controllers.delete_address);
routes.patch("/update-address", auth.authenticateUserApi, controllers.update_address);
routes.post("/create-review", auth.authenticateUserApi, controllers.add_review);
routes.post("/add-to-cart", auth.authenticateUserApi, controllers.add_to_cart);
routes.delete("/cart/:id", auth.authenticateUserApi, controllers.remove_from_cart);
routes.post("/place-order", auth.authenticateUserApi, controllers.add_order);
routes.patch("/cancel-order", auth.authenticateUserApi, controllers.cancel_order);
routes.delete("/delete-account", auth.authenticateUserApi, controllers.delete_account);
routes.patch("/change-name", auth.authenticateUserApi, controllers.change_name);

module.exports = routes;