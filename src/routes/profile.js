const express = require('express');	
const controllers = require('../controllers/profile_controller');

const routes = express.Router();


routes.get("/verify-otp", (req, res) => {
    const error_message = req.session.error || null;
    req.session.error = null;
    return res.render('user/verify_otp', {title: "Verify OTP", error_message, session: req.session.otp});
});

routes.get("/reset-password", (req, res) => {
    const error_message = req.session.error || null;
    req.session.error = null;
    return res.render('user/reset_password', {title: "Reset Password", error_message});
});

routes.post("/send-otp", controllers.send_otp);
routes.post("/verify-otp", controllers.verify_otp);
routes.post("/reset-password", controllers.reset_password);

module.exports = routes;