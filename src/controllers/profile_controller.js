const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const otps = require('../models/otp_model');
const users = require('../models/user_model');

const generate_otp = () => {
    return crypto.randomInt(1000, 9999);
}

const send_otp = async (req, res) => {
    const {email} = req.body;
    const result = await otps.findOne({email});
    if (!result) {
        const user = await users.findOne({email});
        if (!user.password) {
            req.session.error = "Email doesn't exists";
            return res.redirect("/forgot-password");
        }
        const otp = new otps({email, otp: generate_otp()});
        console.log(otp);
        let result = await otp.save();
        req.session.otp = {email, expiry: result.expiry};
        return res.redirect("/user/verify-otp");
    } else {
        req.session.error = "Please wait for sometime to try again";
        return res.redirect("/forgot-password");
    }
}

const verify_otp = async (req, res) => {
    const {otp} = req.body;
    if (!req.session.otp) {
        req.session.error = "Session expired. Please try again";
        return res.redirect("/forgot-password");
    }
    const {email} = req.session.otp;
    const result = await otps.findOne({email, otp});
    if (result) {
        return res.redirect("/user/reset-password");
    } else {
        req.session.error = "Invalid OTP";
        return res.redirect("/user/verify-otp");
    }
};

const reset_password = async (req, res) => {
    const {password} = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashed_password = await bcrypt.hash(password, salt);
    if (!req.session.otp) {
        req.session.error = "Session expired. Please try again";
        return res.redirect("/forgot-password");
    }
    const { email } = req.session.otp;
    const user = await users.findOne({email});
    if (user) {
        await users.updateOne({email}, {$set: {password: hashed_password}});
        delete req.session.otp;
        return res.redirect("/login");
    } else {
        req.session.error = "Failed to reset password";
        return res.redirect("/user/reset-password");
    }
}

module.exports= { send_otp, verify_otp, reset_password }; 