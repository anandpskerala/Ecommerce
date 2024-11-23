const express = require('express');	
const controllers = require('../controllers/user_controller');
const auth = require('../middlewares/user_authentication');

const routes = express.Router();


routes.get("/signup", (req, res) => {
    const error_message = req.session.error || null;
    req.session.error = null;
    return res.render('user/signup', {title: "Signup", error_message});
})

routes.get("/login", (req, res) => {
    const error_message = req.session.error || null;
    req.session.error = null;
    return res.render('user/login', {title: "Login", error_message});
});

routes.get("/", auth.authenticateUser, (req, res) => {
    return res.render('user/home', {title: "Home"});
})

routes.get("/forgot-password", (req, res) => {
    const error_message = req.session.error || null;
    req.session.error = null;
    return res.render('user/forgot_password', {title: "Forgot Password", error_message});
})

routes.post("/signup", controllers.user_signup);
routes.post("/login", controllers.user_login);
routes.get("/logout", controllers.user_logout);
routes.get("/login/google", controllers.google_login);
routes.get("/login/google/auth", controllers.auth_google)


module.exports = routes;