const express = require('express');	
const mongoose = require('mongoose');
const auth = require('../middlewares/user_authentication');
const profile_controller = require('../controllers/user/profile_controller');
const cart_controller = require('../controllers/user/cart_controller');
const order_controller = require('../controllers/user/order_controller');
const user_model = require('../models/user_model');
const cart_model = require('../models/cart_model');
const order_model = require('../models/order_model');
const payment_model = require('../models/payment_model');
const coupon_model = require('../models/coupon_model');
const multer = require('../utils/multer');
const time = require('../utils/time');
const currency = require('../utils/currency');
const wishlist_model = require('../models/wishlist_model');
const return_model = require('../models/return_model');

const routes = express.Router();


routes.get("/verify-otp", (req, res) => {
    if (!req.session.otp) {
        return res.redirect('/forgot-password');
    }
    try {
        const error_message = req.session.error || null;
        req.session.error = null;
        return res.render('user/verify_otp', {title: "Verify OTP", cart_option: "page", error_message, session: req.session.otp});
    } catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
});

routes.get("/verify-signup", (req, res) => {
    if (!req.session.otp) {
        return res.redirect('/signup');
    }
    try {
        const error_message = req.session.error || null;
        req.session.error = null;
        return res.render('user/verify_signup', {title: "Verify OTP", cart_option: "page", error_message, session: req.session.otp});
    } catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
});

routes.get("/reset-password", (req, res) => {
    try {
        const error_message = req.session.error || null;
        req.session.error = null;
        return res.render('user/reset_password', {title: "Reset Password", cart_option: "page", error_message});
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
        return res.render('user/account_page', {title: "Account", cart_option: "page", error_message, user});
    } catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
});

routes.get("/orders", auth.authenticateUser, async (req, res) => {
    try {
        const error_message = req.session.error || null;
        req.session.error = null;
        const { page = 1, limit = 10} = req.query;
        const orders = await order_model.find({user_id: req.session.user.id}).sort({createdAt: -1}).skip((page - 1) * limit).limit(Number(limit)).populate('payment');
        const returns = await return_model.find({user_id: req.session.user.id});
        const total = await order_model.countDocuments({user_id: req.session.user.id});
        return res.render('user/order_page', {
            title: "Orders", 
            cart_option: "page", 
            error_message, 
            orders, 
            time,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            currency,
            returns
        });
    } catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
});

routes.get("/pending-orders", auth.authenticateUser, async (req, res) => {
    try {
        const error_message = req.session.error || null;
        req.session.error = null;
        const { page = 1, limit = 10} = req.query;
        const orders = await order_model.find({user_id: req.session.user.id}).sort({createdAt: -1}).skip((page - 1) * limit).limit(Number(limit)).populate('payment');
        const returns = await return_model.find({user_id: req.session.user.id});
        const total = orders.reduce((acc, curr) => {
            if (curr.payment && curr.payment.status == "failed") {
                acc++;
            }
            return acc;
        }, 0)
        return res.render('user/pending_orders', {
            title: "Pending Orders", 
            cart_option: "page", 
            error_message, 
            orders, 
            time,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            currency,
            returns
        });
    } catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
})

routes.get("/change-password", auth.authenticateUser, (req, res) => {
    return res.render('user/change_password', {title: "Change Password", cart_option: "page"});
});

routes.get("/carts", auth.authenticateUser, async (req, res) => {
    return res.render('user/cart_page', {title: "Cart", cart_option: "page"});
});

routes.post("/carts", auth.authenticateUserApi, cart_controller.load_carts);

routes.get("/manage-address", auth.authenticateUser, async (req, res) => {
    const user = await user_model.findOne({_id: req.session.user.id});
    return res.render('user/address', {title: "Address", cart_option: "page", user});
});

routes.get("/wishlists", auth.authenticateUser, async (req, res) => {
    const user = await user_model.findOne({_id: req.session.user.id});
    const wishlists = await wishlist_model.find({user_id: user._id}).populate("product_id", "_id title images");
    let carts;
    let result = [];
    if (req.session.user) {
        carts = await cart_model.find({user: req.session.user.id}).sort({createdAt: -1}).populate("product");
        result = await cart_model.aggregate([
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
    }
    const total_price = result.length > 0 ? result[0].totalPrice : 0;
    return res.render('user/wishlist_page', {title: "Wishlists", cart_option: "popup", wishlists, session: req.session, carts, total_price});
});

routes.get("/referrals", auth.authenticateUser, async (req, res) => {
    const user = await user_model.findOne({_id: req.session.user.id});
    return res.render('user/referral_page', {title: "Referral", cart_option: "page", user});
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
    let coupon = await coupon_model.findOne({users: {$in: [user._id]}}).sort({updatedAt: -1});
    if (coupon && user.coupon) {
        if (coupon._id.toString() != user.coupon.toString()) {
            coupon = null;
        }
    }
    const total_price = result.length > 0 ? result[0].totalPrice : 0;
    if (carts && carts.length > 0) {
        return res.render('user/checkout_page', {title: "Check Out", cart_option: "page", user, carts, total_price, coupon, session: req.session});
    } else {
        return res.redirect('/user/carts');
    }
});
routes.post("/checkout", auth.authenticateUserApi, cart_controller.load_checkout);

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
    return res.render('user/order_summary', {title: "Order Summary", cart_option: "page", payment, orders, time, user, address, currency});
});

routes.get("/ordered/:id", auth.authenticateUser, async (req, res) => {
    const {id} = req.params;
    if (!id) {
        return res.redirect("/user/orders");
    }
    const payment = await payment_model.findOne({_id: id});
    return res.render('user/order_result', {title: "Order", cart_option: "page", session: req.session, payment});
});

routes.get("/get-a-coupon", auth.authenticateUser, (req, res) => {
    return res.render('user/random_coupon', {title: "Get Coupon", cart_option: "page", session: req.session});
});


routes.post("/send-otp", profile_controller.send_otp);
routes.post("/verify-otp", profile_controller.verify_otp);
routes.post("/verify-signup", profile_controller.verify_signup);
routes.post("/reset-password", profile_controller.reset_password);
routes.get("/wallet", auth.authenticateUser, profile_controller.load_wallet);
routes.post("/change-password", auth.authenticateUserApi, profile_controller.change_password);
routes.post("/change-profile-picture", auth.authenticateUserApi, multer.single("image"), profile_controller.change_profile_picture);
routes.delete("/remove-profile-image", auth.authenticateUserApi, profile_controller.remove_profile_picture);
routes.patch("/change-phone", auth.authenticateUserApi, profile_controller.change_phone);
routes.post("/add-address", auth.authenticateUserApi, profile_controller.add_address);
routes.delete("/delete-address", auth.authenticateUserApi, profile_controller.delete_address);
routes.patch("/update-address", auth.authenticateUserApi, profile_controller.update_address);
routes.post("/create-review", auth.authenticateUserApi, profile_controller.add_review);
routes.post("/add-to-cart", auth.authenticateUserApi, cart_controller.add_to_cart);
routes.delete("/cart/:id", auth.authenticateUserApi, cart_controller.remove_from_cart);
routes.post("/place-order", auth.authenticateUserApi, order_controller.add_order);
routes.patch("/cancel-order", auth.authenticateUserApi, order_controller.cancel_order);
routes.post("/return-order", auth.authenticateUserApi, order_controller.return_order);
routes.delete("/delete-account", auth.authenticateUserApi, profile_controller.delete_account);
routes.patch("/change-name", auth.authenticateUserApi, profile_controller.change_name);
routes.post("/apply-coupon", auth.authenticateUserApi, profile_controller.apply_coupon);
routes.post("/remove-coupon", auth.authenticateUserApi, profile_controller.remove_coupon);
routes.post("/update-wishlist", auth.authenticateUserApi, profile_controller.update_wishlist);
routes.post("/referrals", auth.authenticateUserApi, profile_controller.get_referrals);
routes.post("/update-cart", auth.authenticateUserApi, cart_controller.update_cart_quantity);
routes.post("/get-all-coupons", auth.authenticateUserApi, profile_controller.get_all_coupouns);
routes.post("/get-spin", auth.authenticateUserApi, profile_controller.validate_spin);

module.exports = routes;