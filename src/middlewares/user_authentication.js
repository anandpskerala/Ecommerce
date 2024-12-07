const Users = require('../models/user_model');

const authenticateUser = async (req, res, next) => {
    if (req.session.user) {
        let user = await Users.findOne({email: req.session.user.email});
        if (user && !user.is_blocked) {
            next();
        } else {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                }
                return res.redirect('/login');
            });
        }
    } else {
        return res.redirect("/login");
    }
}

const isAlreadyLogged = async (req, res, next) => {
    if (req.session.user) {
        return res.redirect("/");
    } else {
        next();
    }
}

module.exports = {authenticateUser, isAlreadyLogged};