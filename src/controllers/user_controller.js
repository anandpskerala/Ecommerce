const crypto = require('crypto');
const user_model = require("../models/user_model");
const otp_model = require("../models/otp_model");
const product_model = require("../models/product_model");
const wallet_model = require("../models/wallet_model");
const referral_model = require('../models/referral_model');

const generate_otp = () => {
    return crypto.randomInt(1000, 9999);
}

const user_signup = async (req, res) => {
    const {first_name, last_name, email, password} = req.body;
    try {
        const exists = await user_model.findOne({email: email.toLowerCase()});
        if (exists) {
            req.session.error = "User already exists";
            return res.redirect("/signup");
        }

        const otp = new otp_model({email: email.toLowerCase(), otp: generate_otp()});
        let res_otp = await otp.save();
        
        // const user = new Users({first_name, last_name, email, password});
        // let result = await user.save();

        // if (req.session.admin) {
        //     req.session.user = {
        //         id: result._id,
        //         first_name: result.first_name,
        //         last_name: result.last_name,
        //         email: result.email,
        //     };
        //     req.session.otp = {user: {first_name, last_name, email, password}, expiry: res_otp.expiry};
        //     return res.redirect("/user/verify-signup");
        // } else {
        //     req.session.regenerate((err) => {
        //         if (err) {
        //             console.error("Error regenerating session: " + err);
        //             req.session.error = "Session Error. Please try again.";
        //             return res.redirect("/signup");
        //         }
                
        //         req.session.user = {
        //             id: result._id,
        //             first_name: result.first_name,
        //             last_name: result.last_name,
        //             email: result.email,
        //         };
        //         req.session.otp = {email, expiry: res_otp.expiry};
        
        //         delete req.session.error;
        
        //         return res.redirect("/user/verify-signup");
        //     });
        delete req.session.error;
        req.session.otp = {user: {first_name, last_name, email: email.toLowerCase(), password}, expiry: res_otp.expiry};
        return res.redirect("/user/verify-signup");
    } catch (err) {
        console.log(err);
        req.session.error = "Server Error";
        return res.redirect("/signup");
    }
}

const user_login = async (req, res) => {
    const {email, password} = req.body;
    try {
        const exists = await user_model.findOne({email: email.toLowerCase()});
        if (!exists) {
            req.session.error = "Email or Password doesn't match";
            return res.redirect("/login");
        }

        if (exists.is_blocked) {
            req.session.error = "You can access this account";
            return res.redirect("/login");
        }

        if (!exists.password) {
            req.session.error = "Email or Password doesn't match";
            return res.redirect("/login");
        }

        const isMatch = await exists.comparePassword(password);
        if (!isMatch) {
            req.session.error = "Email or Password doesn't match";
            return res.redirect("/login");
        }


        if (req.session.admin) {
            req.session.user = {
                id: exists._id,
                first_name: exists.first_name,
                last_name: exists.last_name,
                email: exists.email,
            };
            return res.redirect("/");
        } else {
            req.session.regenerate((err) => {
                if (err) {
                    console.error("Error regenerating session: " + err);
                    req.session.error = "Session Error. Please try again.";
                    return res.redirect("/login");
                }
                
                req.session.user = {
                    id: exists._id,
                    first_name: exists.first_name,
                    last_name: exists.last_name,
                    email: exists.email,
                };
        
                delete req.session.error;
        
                return res.redirect("/");
            });
        }
    } catch (err) {
        console.log(err);
        req.session.error = "Server Error";
        return res.redirect("/login");
    }
}


const user_logout = (req, res) => {
    if (req.session.admin) {
        delete req.session.user;
        res.clearCookie('connect.sid');
        return res.redirect("/login");
    }
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session: " + err);
        }
        res.clearCookie('connect.sid');
        return res.redirect("/login");
    }
)};


const google_login = (req, res) => {
    try {
        const REDIRECT_URI = 'http://localhost:3000/login/google/auth';
        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email`;
        return res.redirect(url);
    } catch (err) {
        console.log(err);
        return res.redirect('/error');
    }
}

const auth_google = async (req, res) => {
    const REDIRECT_URI = 'http://localhost:3000/login/google/auth';
    const { code } = req.query;
    const reqs = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        body: JSON.stringify({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            code,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
        })
    })

    const data = await reqs.json();
    try {
        const token = data.access_token;
        const reqs = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
            method: "get",
            headers: {
                Authorization: `Bearer ${token}`,
            }
        })

        const new_data = await reqs.json();
        const exists = await user_model.findOne({email: new_data.email});
        if (!exists) {
            const user = new user_model({
                first_name: new_data.given_name, 
                last_name: new_data.family_name, 
                email: new_data.email, 
                google_id: new_data.id
            });
            let result = await user.save();
            const wallet = new wallet_model({
                user_id: result._id
            });
            await wallet.save();
            const referral = new referral_model({
                user: result._id,
            })
            await referral.save();
            if (req.session.refer) {
                const referrer = await referral_model.findOne({referral_code: req.session.refer});
                if (referrer) {
                    referrer.referred_users.push(result._id);
                    referrer.amount_earned += 100;
                    await referrer.save();
                }
            }
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
            
                    delete req.session.error;
            
                    return res.redirect("/");
                });
            }
        } else {
            if (!exists.google_id) {
                req.session.error = "Already an account exists";
                return res.redirect("/login");
            }

            if (exists.is_blocked) {
                req.session.error = "You can access this account";
                return res.redirect("/login");
            }

            if (req.session.admin) {
                req.session.user = {
                    id: exists._id,
                    first_name: exists.first_name,
                    last_name: exists.last_name,
                    email: exists.email,
                };
                return res.redirect("/");
            } else {
                req.session.regenerate((err) => {
                    if (err) {
                        console.error("Error regenerating session: " + err);
                        req.session.error = "Session Error. Please try again.";
                        return res.redirect("/login");
                    }
                    
                    req.session.user = {
                        id: exists._id,
                        first_name: exists.first_name,
                        last_name: exists.last_name,
                        email: exists.email,
                    };
            
                    delete req.session.error;
            
                    return res.redirect("/");
                });
            }
        }
      } catch (error) {
        console.error('Error:', error);
        res.redirect('/login');
      }
}

const get_products = async (req, res) => {
    try {
        const {search = ""} = req.query;
        const { sort = null } = req.body;
        let filters = []
        console.log(sort)
        if (req.body.filters && req.body.filters.length > 0)  {
            req.body.filters.forEach(filter => {
                filters.push({[filter.type]: filter.name});
            });
        }
        console.log(filters)
        let products;
        if (sort) {
            products = await product_model.aggregate([
                {$unwind: '$variants'},
                {$match: {title: {$regex: new RegExp(`^${search}`, "i")}, ...(filters.length > 0 ? { $and: filters } : {})}},
                {$project: {_id: 1, title: 1, description: 1, images: 1, variants: 1}},
                {$sort: sort},
                {$limit: 25}
            ])
        } else {
            products = await product_model.aggregate([
                {$unwind: '$variants'},
                {$match: {title: {$regex: new RegExp(`^${search}`, "i")}, ...(filters.length > 0 ? { $and: filters } : {})}},
                {$project: {_id: 1, title: 1, description: 1, images: 1, variants: 1}},
                {$limit: 25}
            ])
        }
        res.json(products);
    } catch (err) {
        console.log(err);
        res.status(500).json({message: "Server Error"});
    }
};

module.exports = { user_signup, user_login, user_logout, google_login, auth_google, get_products };