const express = require('express');	
const controllers = require('../controllers/user_controller');
const auth = require('../middlewares/user_authentication');
const product_model = require('../models/product_model');
const category_model = require('../models/category_model');
const offer_model = require('../models/offer_model');

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
        const categories = await category_model.find({});
        const products = await product_model.find({}).limit(10);
        return res.render('user/products', {title: "Products", products, categories});
    }  catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
})

routes.get("/products/:id", async (req, res) => {
    try {
        const {id} = req.params;
        const product = await product_model.findOne({_id: id});
        const offers = await offer_model.find({});
        const similar_products = await product_model.find({_id: { $ne: product._id }, category: product.category, brand: product.brand, listed: true}).limit(5);
        if (!product.listed) {
            return res.redirect('/error');
        }
        return res.render('user/product_page', {title: product.title, product, similar_products, offers});
    }  catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
})

routes.post("/signup", controllers.user_signup);
routes.post("/login", controllers.user_login);
routes.get("/logout", controllers.user_logout);
routes.get("/login/google", controllers.google_login);
routes.get("/login/google/auth", controllers.auth_google)


module.exports = routes;