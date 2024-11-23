const Users = require('../models/user_model');

const authenticateUser = async (req, res, next) => {
    if (req.session.user) {
        let user = await Users.findOne({email: req.session.user.email});
        if (user) {
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

module.exports = {authenticateUser};