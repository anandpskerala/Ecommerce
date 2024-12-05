const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const admins = require('../models/admin_model');
const users = require('../models/user_model');
const brands = require('../models/brand_model');
const category = require('../models/category_model');
const offer = require('../models/offer_model');
const product_model = require('../models/product_model');
const timer = require('../utils/time');
const { console } = require('inspector');

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

const load_products = async (req, res) => {
    const { page = 1, limit = 10, product = "" } = req.query;
    const search_product = product != "" ? {title: {$regex: product}}: {};
    const products = await product_model.find(search_product).skip((page - 1) * limit).limit(Number(limit));
    const total = await product_model.countDocuments();
    return res.render(
        "admin/products", 
        {
            title: "Products",
            page: "Products", 
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            productQuery: product
        }
    );
}

const add_product_form = async (req, res) => {
    try {
        let body = req.body;
        let { variants } = req.body;
        let parse_variants = JSON.parse(variants);
        let files = req.files.map((file) => file.filename);
        let variant_list = [];
        for (variant in parse_variants) {
            variant_list.push({name: variant, ...parse_variants[variant]})
        }
        let data = {...body, images: files, variants: variant_list};
        console.log(data)
        const product = new product_model(data);
        await product.save();
        return res.status(200).json({success: true, message: "Product added successfully"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "An error occurred"});
    }

}

const delete_product = async (req, res) => {
    try {
        const { id } = req.params;
        const exists = await product_model.findOne({_id: id});
        if (!exists) {
            return res.status(404).json({success: false, message: "Product not found"});
        }
        await product_model.deleteOne({_id: id});
        for (image in exists.images) {
            fs.unlink(path.join(__dirname, '../uploads', exists.images[image]), (err) => {
                if (err) console.error("Error deleting file:", err);
                console.log("File deleted successfully");
            });
        }
        return res.status(200).json({success: true, message: "Product deleted successfully"});
    } catch (err) {
        console.error("Error in delete product:", err);
        return res.status(500).json({success: false, message: "An error occurred"});
    }
};

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
    const total = await brands.countDocuments();
    return res.render(
        "admin/brands", 
        {
            title: "Brands",
            page: "Brands",
            brands: all_brands,
            time: timer,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
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
    const { page = 1, limit = 10 } = req.query;
    const categories = await category.find().skip((page - 1) * limit).limit(Number(limit));
    const total = await category.countDocuments();
    return res.render(
        "admin/categories", 
        {
            title: "Categories", 
            page: "Categories", 
            categories,
            time: timer,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
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

const create_offer = async (req, res) => {
    try {
        const { name } = req.body;
        const exists = await offer.findOne({name});
        if (exists) {
            return res.status(400).json({success: false, message: "Offer already exists"});
        }
        
        const offers = new offer(req.body);
        await offers.save();
        return res.status(201).json({success: true, message: "Offer added successfully"});
    } catch (err) {
        console.error("Error in create offer:", err);
        return res.status(500).json({success: false, message: "An error occurred"});
    }
};

const load_offers = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offers = await offer.find().skip((page - 1) * limit).limit(Number(limit));
    const total = await offer.countDocuments();
    return res.render(
        "admin/offers", 
        {
            title: "Offers", 
            page: "Offers", 
            offers,
            time: timer,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
        }
    );
};

const delete_offer = async (req, res) => {
    const { id } = req.params;
    const exists = await offer.findOne({_id: id})
    if (!exists) {
        return res.status(400).json({success: false, message: "Invalid request"});
    }
    await offer.deleteOne({_id: id});
    return res.status(200).json({success: true, message: "Offer deleted successfully"});
};

const remove_product_image = async (req, res) => {
    try {
        const {id, image} = req.body;
        const product = await product_model.findOne({_id: id});
        if (!product) {
            return res.status(400).json({success: false, message: "Invalid request"});
        }
        await product_model.updateOne({_id: id}, {$pull: {images: image}});
        fs.unlink(path.join(__dirname, "../uploads", image), (err) => {
            if (err) console.error("Error deleting file:", err);
            console.log("File deleted successfully");
        });
        return res.status(200).json({success: true, message: "Image removed successfully"});
    } catch (err) {
        console.error("Error in remove product image:", err);
        return res.status(500).json({success: false, message: "An error occurred"});
    }
}

const add_product_image = async (req, res) => {
    try {
        const { id } = req.body;
        let files = req.files.map((file) => file.filename);
        const product = await product_model.findOne({_id: id});
        if (!product) {
            return res.status(400).json({success: false, message: "Invalid request"});
        }
        await product_model.updateOne({_id: id}, {$push: {images: {$each: files}}});
        return res.status(200).json({success: true, message: "Image added successfully"});
    } catch (err) {
        console.error("Error in add product image:", err);
        return res.status(500).json({success: false, message: "An error occurred"});
    }
}

const product_options = async (req, res) => {
    try {
        const {id, action} = req.body;
        await product_model.updateOne({_id: id}, {$set: {listed: action}});
        return res.status(200).json({success: true, message: `Product ${action == true ? 'listed': 'unlisted'} successfully`});
    } catch (error) {
        console.log("Error in Product otions" + error)
        return res.status(500).json({success: false, message: "An error occurred"});
    }
};

const edit_product_form = async (req, res) => {
    try {
        let { id, variants, colors} = req.body;
        colors = JSON.parse(colors);
        let parse_variants = JSON.parse(variants);
        let variant_list = [];
        for (variant in parse_variants) {
            variant_list.push({name: variant, ...parse_variants[variant]})
        }

        let data = {...req.body, variants: variant_list, colors};
        await product_model.updateOne({_id: id}, {$set: data})
        return res.status(200).json({success: true, message: `Product Updated`})
    } catch (err) {
        console.log("Error in edit product form" + err)
        return res.status(500).json({success: false, message: `An error occurred ${err}`});
    }
};

module.exports = { 
    admin_login, 
    load_user, 
    admin_logout, 
    edit_user, 
    delete_user,
    load_products,
    add_product_form,
    delete_product,
    add_brand_form, 
    load_brands,
    edit_brands,
    delete_brand,
    add_category_form,
    load_category,
    edit_category,
    delete_category,
    create_offer,
    load_offers,
    delete_offer,
    remove_product_image,
    add_product_image,
    product_options,
    edit_product_form
};