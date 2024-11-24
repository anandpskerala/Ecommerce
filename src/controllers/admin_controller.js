const admins = require('../models/admin_model');

const admin_login = async (req, res) => {
    const {email, password} = req.body;
    try {
        const admin = await admins.findOne({email});
        if (!admin) {
            req.session.error = "Invalid email or password";
            return res.redirect("/admin/login");
        }
        
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            req.session.error = "Invalid email or password";
            return res.redirect("/admin/login");
        }
        
        req.session.admin = {id: admin._id, email: admin.email};
        return res.redirect("/admin/dashboard");
    } catch (error) {
        console.error("Error in admin login:", error);
        req.session.error = "An error occurred";
        return res.redirect("/admin/login");
    }
}

module.exports = { admin_login };