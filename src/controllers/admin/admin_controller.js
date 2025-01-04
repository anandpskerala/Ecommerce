const bcrypt = require('bcryptjs');
const admins = require('../../models/admin_model');
const users = require('../../models/user_model');
const order_model = require('../../models/order_model');
const payment_model = require('../../models/payment_model');


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
    return res.render(
        "admin/customers", {
            title: "Customers", 
            page: "Customers",
        }
    );
}

const get_users = async (req, res) => {
    const { page = 1, limit = 10, email = "" } = req.body;
    const search_email = email != "" ? {email: {$regex: email}}: {};
    const all_users = await users.find(search_email).sort({createdAt: -1}).skip((page - 1) * limit).limit(Number(limit));
    const total = await users.countDocuments(search_email);
    return res.status(200).json(
        {
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

const get_reports = async (req, res) => {
    let { start_date, end_date } = req.body;
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    start_date.setUTCHours(0,0,0);
    end_date.setUTCHours(23,59,59);
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
                status: "success",
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
                status: { $in: ["delivered"] },
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

    const orders = await order_model.aggregate([
        {
            $match: {
                status: { $in: ["delivered"] },
                createdAt: {
                    $gte: start_date, 
                    $lte: end_date 
                }
            }
        },
        {
            $lookup: {
                from: "products",
                localField: "product_id",
                foreignField: "_id",
                as: "product_info"
            }
        },
        {
            $unwind: "$product_info"
        },
        {
            $group: {
                _id: { product_id: "$product_id", product_name: "$product_info.title", category: "$product_info.category", brand: "$product_info.brand" },
                product_count: { $sum: "$quantity" }
            }
        },
        {
            $facet: {
                product_counts: [
                    {
                        $project: {
                            _id: 0,
                            product_id: "$_id.product_id",
                            product_name: "$_id.product_name",
                            product_count: 1
                        }
                    },
                    {
                        $sort: { product_count: -1 },
                    },
                    {
                        $limit: 10
                    }
                ],
                category_counts: [
                    {
                        $group: {
                            _id: "$_id.category",
                            category_count: { $sum: "$product_count" }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            category: "$_id",
                            category_count: 1
                        },
                    },
                    {
                        $sort: { category_count: -1 },
                    },
                    {
                        $limit: 10
                    }
                ],
                brand_counts: [
                    {
                        $group: {
                            _id: "$_id.brand",
                            brand_count: { $sum: "$product_count" }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            brand: "$_id",
                            brand_count: 1
                        }
                    },
                    {
                        $sort: { brand_count: -1 },
                    },
                    {
                        $limit: 10
                    }
                ]
            }
        }
    ]);
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
                product_id: { $addToSet: "$order_number"},
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
    const sales_report =
            method === "product"
                ? await get_product_report(start, end)
                : await get_category_report(start, end);
    
    
    const payment_report = await payment_model.find({createdAt: {$gte: start, $lte: end}}, {coupon_discount: 1});
    return res.json({sales: sales_report, coupons: payment_report});
};


const get_ledger_book = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const filter = {};

        if (startDate && endDate) {
            filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const orders = await order_model.find(filter)
            .populate('user_id', 'name email')
            .populate('product_id', 'name price')
            .populate('payment', 'method status amount');

        const payments = await payment_model.find(filter)
            .populate('user_id', 'name email')
            .populate('orders', 'order_number');

        const ledger = orders.map(order => {
            if (order.payment) {
                return {
                    order_number: order.order_number,
                    user: order.user_id.name,
                    product: order.product_id.name,
                    quantity: order.quantity,
                    price: order.price,
                    discount: order.discount,
                    status: order.status,
                    payment_method: order.payment.method,
                    payment_status: order.payment.status,
                    payment_mount: order.payment.amount,
                    created_at: order.createdAt
                };
            }
        });

        const total_revenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const total_orders = orders.length;

        res.json({ success: true, ledger, summary: { total_revenue, total_orders } });
    } catch (error) {
        console.error('Error fetching ledger book:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
}

module.exports = { 
    admin_login, 
    load_user, 
    admin_logout, 
    edit_user, 
    delete_user,
    get_reports,
    get_sales_report,
    get_ledger_book,
    get_users
};