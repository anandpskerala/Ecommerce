const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const otps = require('../models/otp_model');
const users = require('../models/user_model');

const generate_otp = () => {
    return crypto.randomInt(1000, 9999);
}

const send_otp = async (req, res) => {
    const {email} = req.body;
    const result = await otps.findOne({email: email.toLowerCase()});
    if (!result) {
        const user = await users.findOne({email: email.toLowerCase()});
        if (!user.password) {
            req.session.error = "Email doesn't exists";
            return res.redirect("/forgot-password");
        }
        const otp = new otps({email: email.toLowerCase(), otp: generate_otp()});
        console.log(otp);
        let result = await otp.save();
        req.session.otp = {email: email.toLowerCase(), expiry: result.expiry};
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

const verify_signup = async (req, res) => {
    const {otp} = req.body;
    if (!req.session.otp) {
        req.session.error = "Session expired. Please try again";
        return res.redirect("/signup");
    }
    const {user} = req.session.otp;
    const result = await otps.findOne({email: user.email, otp});
    if (result) {
        const user_model = new users({...user})
        let result = await user_model.save();

        if (req.session.admin) {
            req.session.user = {
                id: result._id,
                first_name: result.first_name,
                last_name: result.last_name,
                email: result.email,
            };
            return res.redirect("/");
        } else {
            req.session.regenerate((err) => {
                if (err) {
                    console.error("Error regenerating session: " + err);
                    req.session.error = "Session Error. Please try again.";
                    return res.redirect("/signup");
                }
                
                req.session.user = {
                    id: result._id,
                    first_name: result.first_name,
                    last_name: result.last_name,
                    email: result.email,
                };
                
            return res.redirect("/");
            });
        }
    } else {
        req.session.error = "Invalid OTP";
        return res.redirect("/user/verify-signup");
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

module.exports= { send_otp, verify_otp, reset_password, verify_signup }; 