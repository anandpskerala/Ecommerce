const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const admins = require('../models/admin_model');
const users = require('../models/user_model');
const brands = require('../models/brand_model');
const category = require('../models/category_model');
const offer = require('../models/offer_model');
const coupon_model = require('../models/coupon_model');
const product_model = require('../models/product_model');
const order_model = require('../models/order_model');
const return_model = require('../models/return_model');
const payment_model = require('../models/payment_model');
const timer = require('../utils/time');
const currency = require("../utils/currency");
const offer_model = require('../models/offer_model');


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
            productQuery: product,
            currency
        }
    );
};

const add_product_form = async (req, res) => {
    try {
        let body = req.body;
        let { variants, colors } = req.body;
        let parse_variants = JSON.parse(variants);
        let files = req.files.map((file) => file.filename);
        let variant_list = [];
        for (variant in parse_variants) {
            variant_list.push({name: variant, ...parse_variants[variant]})
        }
        let data = {...body, images: files, variants: variant_list, colors: colors.split(",")};
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
        const exists = await brands.findOne({name: {$regex: new RegExp(`^${name}$`, 'i')}});
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
        const exists = await category.findOne({name: {$regex: new RegExp(`^${name}$`, 'i')}});
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
        return res.status(500).json({success: false, message: "An error occurred" + err});
    }
}

const load_category = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const categories = await category.find().skip((page - 1) * limit).limit(Number(limit));
    const offers = await offer_model.find({type: "category"});
    const total = await category.countDocuments();
    return res.render(
        "admin/categories", 
        {
            title: "Categories", 
            page: "Categories", 
            categories,
            offers,
            time: timer,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
        }
    );
}

const edit_category = async (req, res) => {
    try {
        const {id, name, description, status, offer} = req.body;
        const cate = await category.findOne({_id: id});
        if (req.file) {
            fs.unlink(path.join(__dirname, "../uploads", cate.image), (err) => {
                if (err) console.error("Error deleting file:", err);
                console.log("File deleted successfully");
            });
        }

        console.log(req.file)
        const data = req.file ? {name: name, description: description, status: status, image: req.file.filename, offer, updatedAt: Date.now()} : {name: name, description: description, status: status, offer, updatedAt: Date.now()};
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
        const exists = await offer.findOne({name: {$regex: new RegExp(`^${name}$`, 'i')}});
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
        console.log(action)
        await product_model.updateOne({_id: id}, {$set: {listed: action}});
        return res.status(200).json({success: true, message: `Product ${action == 'true' ? 'listed': 'unlisted'} successfully`});
    } catch (error) {
        console.log("Error in Product otions" + error)
        return res.status(500).json({success: false, message: "An error occurred"});
    }
};

const edit_product_form = async (req, res) => {
    try {
        let { id, variants, colors} = req.body;
        let parse_variants = JSON.parse(variants);
        let variant_list = [];
        for (variant in parse_variants) {
            variant_list.push({name: variant, ...parse_variants[variant]})
        }

        let data = {...req.body, variants: variant_list, colors: colors.split(",")};
        await product_model.updateOne({_id: id}, {$set: data})
        return res.status(200).json({success: true, message: `Product Updated`})
    } catch (err) {
        console.log("Error in edit product form" + err)
        return res.status(500).json({success: false, message: `An error occurred ${err}`});
    }
};

const load_orders = async (req, res) => {
    const { page = 1, limit = 10, status = "" } = req.query;
    const query = status ? { status } : {};
    const orders = await order_model.find(query).sort({createdAt: -1}).skip((page - 1) * limit).limit(Number(limit)).populate('user_id', 'first_name last_name email');
    const total = await order_model.countDocuments();
    return res.render("admin/orders", {
        title: "Orders", 
        page: "Orders", 
        orders, 
        time: timer, 
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
        total,
        currency
    });
}

const set_order_status = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason = "" } = req.body;
        if (status == "delivered") {
            const payment = await payment_model.findOne({orders: {$in: [id]}});
            if (!payment) {
                return res.status(400).json({success: false, message: "Payment not found for this order"});
            }

            if (payment.status == "pending") {
                payment.status = "success";
                await payment.save();
            }
        }
        await order_model.updateOne({_id: id}, {$set: {status, reason}});
        return res.status(200).json({success: true, message: `Order status updated successfully`});
    } catch (error) {
        console.log("Error in set order status" + error)
        return res.json({success: false, message: `An error occurred`});
    }
};

const add_coupon = async (req, res) => {
    try {
        const {
            name, 
            description, 
            activation, 
            expiry, 
            discount, 
            min_amount, 
            type,
            status,
            limit
        } = req.body;
        const exists = await coupon_model.findOne({name: {$regex: new RegExp(`^${name}$`, 'i')}});
        if (exists) {
            return res.json({success: false, message: "Coupon already exists"});
        }
        const coupon = new coupon_model({ name, description, activation, discount, expiry, type, min_amount, status, limit});
        await coupon.save();
        return res.status(201).json({success: true, message: "Coupon added successfully"});
    } catch (error) {
        console.log("Error in add coupon" + error)
        return res.json({success: false, message: "An error occurred"});
    }
};


const load_coupons = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const coupons = await coupon_model.find().skip((page - 1) * limit).limit(Number(limit));
    const total = await coupon_model.countDocuments();
    return res.render("admin/coupons", {
        title: "Coupons", 
        page: "Coupons", 
        coupons,
        time: timer,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
    });
};

const edit_coupon = async (req, res) => {
    const {id} = req.params;
    const coupon = await coupon_model.findOne({_id: id});
    return res.render("admin/edit_coupon", {title: "Coupons", page: "Edit Coupon", coupon});
};

const edit_coupon_form = async (req, res) => {
    try {
        const {
            id,
            name, 
            description, 
            activation, 
            expiry, 
            discount, 
            min_amount, 
            type,
            status,
            limit
        } = req.body;
        const coupon = await coupon_model.findOne({_id: id});
        if (!coupon) {
            return res.json({success: false, message: "Coupon doesn't exists"});
        }
        coupon.name = name;
        coupon.description = description;
        coupon.activation = activation;
        coupon.expiry = expiry;
        coupon.discount = discount;
        coupon.min_amount = min_amount;
        coupon.type = type;
        coupon.status = status;
        coupon.limit = limit;
        await coupon.save();
        return res.status(201).json({success: true, message: "Coupon updated successfully"});
    } catch (error) {
        console.log("Error in add coupon" + error)
        return res.json({success: false, message: "An error occurred" + error});
    }
};

const delete_coupon = async (req, res) => {
    const {id} = req.params;
    await coupon_model.deleteOne({_id: id});
    return res.status(200).json({success: true, message: "Coupon deleted successfully"});
};

const load_returns = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const returns = await return_model.find().sort({createdAt: -1}).skip((page - 1) * limit).limit(Number(limit)).populate('order_id', 'name price image').populate('user_id', 'first_name last_name');
    const total = await return_model.countDocuments();
    console.log(returns)
    return res.render("admin/return_page", {
        title: "Returns", 
        page: "Returns", 
        returns,
        time: timer,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
    });
}

const update_return = async (req, res) => {
    const {return_id, status, rejection_reason = null} = req.body;
    const return_data = await return_model.findOne({_id: return_id});
    if (!return_data) {
        return res.status(400).json({success: false, message: "Invalid return request"});
    }

    return_data.status = status;
    if (status === "rejected") {
        return_data.rejection_reason = rejection_reason;
    }
    await return_data.save();
    const order = await order_model.findOne({_id: return_data.order_id});
    order.status = "returned";
    await order.save();
    return res.status(200).json({success: true, message: "Return status updated successfully"});
};

const get_reports = async (req, res) => {
    const now = new Date();
    const start_date = new Date(now.getFullYear(), now.getMonth() + 0, 1);
    const end_date = new Date(now.getFullYear(), now.getMonth() + 0 + 1, 0)
    const user_data = await users.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: start_date, 
                    $lte: end_date 
                }
            }
        },
        {
            $group: {
                _id: { 
                    year: { $year: "$createdAt" }, 
                    month: { $month: "$createdAt" },
                    day: { $dayOfMonth: "$createdAt" } 
                },
                user_count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                year: "$_id.year",
                month: "$_id.month",
                date: {
                    $concat: [
                      { $toString: "$_id.year" }, "-",
                      { $toString: "$_id.month" }, "-",
                      { $toString: "$_id.day" }
                    ]
                },
                user_count: 1
            }
        },
        {
            $sort: { year: 1, month: 1, date: 1 }
        }
        ]);
    
    const sales_data = await payment_model.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: start_date, 
                    $lte: end_date 
                }
            }
        },
        {
            $group: {
                _id: { 
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                    day: { $dayOfMonth: "$createdAt" }
                },
                total_amount: { $sum: "$amount" }
            }
        },
        {
            $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
        },
        {
            $project: {
                _id: 0,
                date: {
                    $concat: [
                      { $toString: "$_id.year" }, "-",
                      { $toString: "$_id.month" }, "-",
                      { $toString: "$_id.day" }
                    ]
                },
                total_amount: 1
            }
        }
    ]);

    const order_data = await order_model.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: start_date, 
                    $lte: end_date
                }
            }
        },
        {
            $group: {
                _id: "$status",
                order_count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                status: "$_id",
                order_count: 1
            }
        }
    ])

    const orders = await order_model.find({}).sort({createdAt: -1}).limit(5).populate('user_id');
    return res.json({success: true, sales_data, user_data, order_data, orders});
};

const get_product_report = async (start, end) => {
    start = new Date(new Date(start).setUTCHours(0, 0, 0, 0));
    end = new Date(new Date(end).setUTCHours(23, 59, 59, 999));
    return await order_model.aggregate([
        {
            $match: {
                status: { $in: ["shipped", "delivered", "returned"] },
                createdAt: { $gte: start, $lte: end },
            },
        },
        {
            $group: {
                _id: "$product_id",
                product_name: { $first: "$name" },
                total_sold: { $sum: "$quantity" },
                total_discounts: {
                    $sum: {
                        $cond: [
                            { $ne: ["$status", "returned"] },
                            { $multiply: ["$discount", "$quantity"] },
                            0,
                        ],
                    },
                },
                total_returns: {
                    $sum: { $cond: [{ $eq: ["$status", "returned"] }, "$quantity", 0] },
                },
                total_revenue: {
                    $sum: {
                        $cond: [
                            { $ne: ["$status", "returned"] },
                            { $multiply: ["$price", "$quantity"] },
                            0,
                        ],
                    },
                },
            },
        },
        { $sort: { total_revenue: -1 } },
    ]);
};

const get_category_report = async (start, end) => {
    return await order_model.aggregate([
        {
            $match: {
                status: { $in: ["shipped", "delivered", "returned"] },
                createdAt: { $gte: start, $lte: end },
            },
        },
        {
            $lookup: {
                from: "products",
                localField: "product_id",
                foreignField: "_id",
                as: "product_details",
            },
        },
        { $unwind: "$product_details" },
        {
            $group: {
                _id: "$product_details.category",
                total_sales: { $sum: "$quantity" },
                total_discounts: {
                    $sum: {
                        $cond: [
                            { $ne: ["$status", "returned"] },
                            { $multiply: ["$discount", "$quantity"] },
                            0,
                        ],
                    },
                },
                total_returns: {
                    $sum: { $cond: [{ $eq: ["$status", "returned"] }, "$quantity", 0] },
                },
                total_revenue: {
                    $sum: {
                        $cond: [
                            { $ne: ["$status", "returned"] },
                            { $multiply: ["$price", "$quantity"] },
                            0,
                        ],
                    },
                },
            },
        },
        { $sort: { total_revenue: -1 } },
    ]);
};

const get_sales_report = async (req, res) => {
    let { method, start = null, end = null } = req.body;
    console.log(start, end);
    const sales_report =
            method === "product"
                ? await get_product_report(start, end)
                : await get_category_report(start, end);
    
    const payment_report = await payment_model.find({createdAt: {$gte: start, $lte: end}}, {coupon_discount: 1});
    return res.json({sales: sales_report, coupons: payment_report});
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
    edit_product_form,
    load_orders,
    set_order_status,
    add_coupon,
    load_coupons,
    edit_coupon,
    edit_coupon_form,
    delete_coupon,
    load_returns,
    update_return,
    get_reports,
    get_sales_report
};