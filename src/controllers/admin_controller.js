const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const admins = require('../models/admin_model');
const users = require('../models/user_model');
const brands = require('../models/brand_model');
const category = require('../models/category_model');
const timer = require('../utils/time');

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
        
        if (req.session.user) {
            req.session.admin = {id: admin._id, email: admin.email, role: admin.role};
            return res.redirect("/admin/dashboard");
        } else {
            req.session.regenerate((err) => {
                if (err) {
                    console.error("Error regenerating session: " + err);
                    req.session.error = "Session Error. Please try again.";
                    return res.redirect("/admin/login");
                }
                req.session.admin = {id: admin._id, email: admin.email, role: admin.role};
                delete req.session.error;
                return res.redirect("/admin/dashboard");
            })
        }
    } catch (error) {
        console.error("Error in admin login:", error);
        req.session.error = "An error occurred";
        return res.redirect("/admin/login");
    }
}

const load_user = async (req, res) => {
    const { page = 1, limit = 10, email = "" } = req.query;
    const search_email = email != "" ? {email: {$regex: email}}: {};
    const all_users = await users.find(search_email).skip((page - 1) * limit).limit(Number(limit));
    const total = await users.countDocuments();
    return res.render(
        "admin/customers", {
            title: "Customers", 
            page: "Customers", 
            data: all_users,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            email
        }
    );
}

const admin_logout = (req, res) => {
    if (req.session.user) {
        res.clearCookie('connect.sid');
        delete req.session.admin;
        return res.redirect("/admin/login");
    }
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session: " + err);
        }
        res.clearCookie('connect.sid');
        return res.redirect("/admin/login");
    }
)};

const edit_user = async (req, res) => {
    try {
        const data = req.body;
        if (data) {
            const exist = await users.findOne({email: data.newemail});
            if (exist && data.newemail !== data.email) {
                return res.status(400).json({success: false, message: "Email already exists"});
            }
            await users.updateOne(
                {email: data.email}, 
                {
                    $set: {
                        email: data.newemail, 
                        first_name: data.first_name, 
                        last_name: data.last_name,
                        phone_number: data.phone_number,
                        is_blocked: data.is_blocked
                    }
                }
            )
            return res.status(200).json({success: true, message: "User updated successfully"});
        }
    } catch (err) {
        console.error("Error in edit user:", err);
        return res.status(500).json({success: false, message: "An error occured"});
    }
}

const delete_user = async (req, res) => {
    try {
        const { id } = req.body;
        if (id) {
            await users.deleteOne({_id: id});
            return res.status(200).json({success: true, message: "User deleted successfully"});
        }
        return res.status(400).json({success: false, message: "Invalid request"});
    } catch (err) {
        console.error("Error in delete user:", err);
        return res.status(500).json({success: false, message: "An error occured"});
    }
}

const add_product_form = async (req, res) => {
    console.log(req.body);
    console.log(req.files)
}

const add_brand_form = async (req, res) => {
    try {
        const {name, description} = req.body;
        const image = req.file.filename;
        const exists = await brands.findOne({name});
        if (exists) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Error deleting file:", err);
                console.log("File deleted successfully");
            });
            return res.status(400).json({success: false, message: "Brand already exists"});
        }
        
        const brand = new brands({name, description, image});
        await brand.save();
        return res.status(201).json({success: true, message: "Brand added"});
    } catch (err) {
        console.error("Error in add brand:", err);
        return res.status(500).json({success: false, message: "An error occurred"});
    }
}

const load_brands = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const all_brands = await brands.find().skip((page - 1) * limit).limit(Number(limit));
    return res.render(
        "admin/brands", 
        {
            title: "Brands",
            page: "Brands",
            brands: all_brands,
            time: timer
        }
    );
}

const edit_brands = async (req, res) => {
    try {
        const {id, name, description, status} = req.body;
        const brand = await brands.findOne({_id: id});
        if (req.file) {
            fs.unlink(path.join(__dirname, "../uploads", brand.image), (err) => {
                if (err) console.error("Error deleting file:", err);
                console.log("File deleted successfully");
            });
        }
        const data = req.file ? {name: name, description: description, status: status, image: req.file.filename, updatedAt: Date.now()} : {name: name, description: description, status: status, updatedAt: Date.now()};
        await brands.updateOne({_id: id}, {$set: data});
        return res.status(200).json({success: true, message: "Brand updated successfully"});
    } catch (err) {
        console.log(err);
        return res.status(500).json({success: false, message: "An error occurred"});
    }
};

const delete_brand = async (req, res) => {
    const { id } = req.params;
    const exists = await brands.findOne({_id: id})
    if (!exists) {
        return res.status(400).json({success: false, message: "Invalid request"});
    }
    await brands.deleteOne({_id: id});
    fs.unlink(path.join(__dirname, "../uploads", exists.image), (err) => {
        if (err) console.error("Error deleting file:", err);
        console.log("File deleted successfully");
    });
    return res.status(200).json({success: true, message: "Brand deleted successfully"});
};

const add_category_form = async (req, res) => {
    try {
        const {name, description} = req.body;
        const image = req.file.filename;
        const exists = await category.findOne({name});
        if (exists) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Error deleting file:", err);
                console.log("File deleted successfully");
            });
            return res.status(400).json({success: false, message: "Category already exists"});
        }
        
        const cate = new category({name, description, image});
        await cate.save();
        return res.status(201).json({success: true, message: "Category added"});
    } catch (err) {
        console.error("Error in add brand:", err);
        return res.status(500).json({success: false, message: "An error occurred"});
    }
}

const load_category = async (req, res) => {
    const categories = await category.find({});
    return res.render(
        "admin/categories", 
        {
            title: "Categories", 
            page: "Categories", 
            categories,
            time: timer
        }
    );
}

const edit_category = async (req, res) => {
    try {
        const {id, name, description, status} = req.body;
        const cate = await category.findOne({_id: id});
        if (req.file) {
            fs.unlink(path.join(__dirname, "../uploads", cate.image), (err) => {
                if (err) console.error("Error deleting file:", err);
                console.log("File deleted successfully");
            });
        }

        console.log(req.file)
        const data = req.file ? {name: name, description: description, status: status, image: req.file.filename, updatedAt: Date.now()} : {name: name, description: description, status: status, updatedAt: Date.now()};
        await category.updateOne({_id: id}, {$set: data});
        return res.status(200).json({success: true, message: "Category updated successfully"});
    } catch (err) {
        console.log(err);
        return res.status(500).json({success: false, message: "An error occurred"});
    }
};

const delete_category = async (req, res) => {
    const { id } = req.params;
    const exists = await category.findOne({_id: id})
    if (!exists) {
        return res.status(400).json({success: false, message: "Invalid request"});
    }
    await category.deleteOne({_id: id});
    fs.unlink(path.join(__dirname, "../uploads", exists.image), (err) => {
        if (err) console.error("Error deleting file:", err);
        console.log("File deleted successfully");
    });
    return res.status(200).json({success: true, message: "Category deleted successfully"});
};

module.exports = { 
    admin_login, 
    load_user, 
    admin_logout, 
    edit_user, 
    delete_user, 
    add_product_form, 
    add_brand_form, 
    load_brands,
    edit_brands,
    delete_brand,
    add_category_form,
    load_category,
    edit_category,
    delete_category
};