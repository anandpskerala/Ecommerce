const express = require('express');	
const controllers = require('../controllers/user_controller');
const auth = require('../middlewares/user_authentication');
const product_model = require('../models/product_model');

const routes = express.Router();


routes.get("/signup", (req, res) => {
    try {
        const error_message = req.session.error || null;
        req.session.error = null;
        return res.render('user/signup', {title: "Signup", error_message});
    } catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
})

routes.get("/login", (req, res) => {
    try {
        const error_message = req.session.error || null;
        req.session.error = null;
        return res.render('user/login', {title: "Login", error_message});
    } catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
});

routes.get("/", auth.authenticateUser, (req, res) => {
    try {
        return res.render('user/home', {title: "Home"});
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

routes.get("/products/:id", async (req, res) => {
    try {
        const {id} = req.params;
        const product = await product_model.findOne({_id: id});
        if (!product.listed) {
            return res.redirect('/error');
        }
        return res.render('user/product_page', {title: "Product", product});
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