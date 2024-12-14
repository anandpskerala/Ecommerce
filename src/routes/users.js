const express = require('express');	
const mongoose = require('mongoose');
const controllers = require('../controllers/user_controller');
const auth = require('../middlewares/user_authentication');
const product_model = require('../models/product_model');
const category_model = require('../models/category_model');
const offer_model = require('../models/offer_model');
const review_model = require('../models/review_model');
const cart_model = require('../models/cart_model');
const time = require('../utils/time');

const routes = express.Router();


routes.get("/signup", auth.isAlreadyLogged, (req, res) => {
    try {
        const error_message = req.session.error || null;
        req.session.error = null;
        return res.render('user/signup', {title: "Signup", error_message});
    } catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
})

routes.get("/login", auth.isAlreadyLogged, (req, res) => {
    try {
        const error_message = req.session.error || null;
        req.session.error = null;
        return res.render('user/login', {title: "Login", error_message});
    } catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
});

routes.get("/", auth.authenticateUser, async (req, res) => {
    try {
        const new_products = await product_model.find({listed: true}).sort({_id: -1}).limit(5);
        return res.render('user/home', {title: "Home", new_arrivals: new_products});
    }  catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
})

routes.get("/forgot-password", (req, res) => {
    const error_message = req.session.error || null;
    req.session.error = null;
    return res.render('user/forgot_password', {title: "Forgot Password", error_message});
})

routes.get("/error", (req, res) => {
    try {
        return res.render('partials/user/error', {title: "Error"});
    }  catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
})

routes.get("/products", auth.authenticateUser, async (req, res) => {
    try {
        const {search = ""} = req.query;
        const categories = await category_model.find({});
        const products = await product_model.aggregate([
            {$unwind: '$variants'},
            {$match: {title: {$regex: new RegExp(`^${search}`, "i")}}},
            {$project: {_id: 1, title: 1, description: 1, images: 1, variants: 1}},
            {$limit: 25}
        ]);
        return res.render('user/products', {title: "Products", products, categories});
    }  catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
})

routes.get("/product/:id", auth.authenticateUser, async (req, res) => {
    try {
        const {id} = req.params;
        const product = await product_model.findOne({_id: id});
        const offers = await offer_model.find({});
        const reviews = await review_model.find({product_id: product._id}).limit(5).populate('user_id', 'first_name last_name email image');
        const rating = await review_model.aggregate([
            { $match: { product_id: product._id } },
            {
                $group: {
                    _id: "$product_id",
                    totalRating: { $sum: "$rating" },
                    averageRating: { $avg: "$rating" },
                    reviewCount: { $count: {} }
                }
            }
        ]);

        const similar_products = await product_model.find({$and: [
            { _id: { $ne: product._id } },
            { listed: true },
            {
                $or: [
                    { category: product.category },
                    { brand: product.brand }
                ]
            }
        ]}).limit(5);

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
        return res.render('user/product_page', {title: product.title, product, similar_products, offers, reviews, time, rating: rating[0], carts, total_price});
    }  catch (err) {
        console.log(err);   
        return res.redirect('/');
    }
})

routes.post("/signup", controllers.user_signup);
routes.post("/login", controllers.user_login);
routes.get("/logout", controllers.user_logout);
routes.get("/login/google", controllers.google_login);
routes.get("/login/google/auth", controllers.auth_google)
routes.post("/products", auth.authenticateUser, controllers.get_products)


module.exports = routes;