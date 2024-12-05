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

const authenticateAdminApI = async (req, res, next) => {
    if (req.session.admin) {
        let user = await admins.findOne({email: req.session.admin.email});
        if (user) {
            next();
        } else {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                }
                return res.status(403).json({success: false, message: "You don't have the authorization to perform this action"});
            });
        }
    } else {
        return res.status(403).json({success: false, message: "You don't have the authorization to perform this action"});
    }
}
module.exports = {authenticateAdmin, authenticateAdminApI};