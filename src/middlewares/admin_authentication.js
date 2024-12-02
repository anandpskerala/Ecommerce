const admins = require('../models/admin_model');

const authenticateAdmin = async (req, res, next) => {
    if (req.session.admin) {
        let user = await admins.findOne({email: req.session.admin.email});
        if (user) {
            next();
        } else {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                }
                return res.redirect('/admin/login');
            });
        }
    } else {
        return res.redirect("/admin/login");
    }
}

module.exports = {authenticateAdmin};