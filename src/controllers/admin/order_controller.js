const order_model = require('../../models/order_model');
const return_model = require('../../models/return_model');
const payment_model = require('../../models/payment_model');
const timer = require('../../utils/time');
const currency = require("../../utils/currency");
const wallet_model = require('../../models/wallet_model');

const load_orders = async (req, res) => {
    return res.render("admin/orders", {
        title: "Orders", 
        page: "Orders", 
    });
}

const get_orders = async (req, res) => {
    const { page = 1, limit = 10, status = "" } = req.body;
    const query = status ? { status } : {};
    const orders = await order_model.find(query).sort({createdAt: -1}).skip((page - 1) * limit).limit(Number(limit)).populate('user_id', 'first_name last_name email');
    const total = await order_model.countDocuments(query);
    return res.status(200).json({
        success: true,
        orders, 
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
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
                await payment_model.updateOne({_id: payment._id}, {$set: {status: "success"}});
            }
        }
        await order_model.updateOne({_id: id}, {$set: {status, reason}});
        return res.status(200).json({success: true, message: `Order status updated successfully`});
    } catch (error) {
        console.log("Error in set order status" + error)
        return res.json({success: false, message: `An error occurred`});
    }
};



const load_returns = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const returns = await return_model.find().sort({createdAt: -1}).skip((page - 1) * limit).limit(Number(limit)).populate('order_id', 'name price image').populate('user_id', 'first_name last_name');
    const total = await return_model.countDocuments();
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
    const order = await order_model.findOne({_id: return_data.order_id});
    if (!order) {
        return res.status(400).json({success: false, message: "Invalid order"});
    }

    return_data.status = status;
    if (status === "rejected") {
        return_data.rejection_reason = rejection_reason;
    } else {
        await order_model.updateOne({_id: order._id}, {$set: {status: "returned"}});
        await payment_model.updateOne({_id: order.payment}, {$set: {status: "refund"}});
        await wallet_model.updateOne({user_id: return_data.user_id}, {
            $push: {
                transactions: {
                    type: "credit",
                    amount: order.quantity * order.price,
                    description: "Refund due to Return"
                }
            },
            $inc: {
                balance: order.quantity * order.price
            }
        })
    }
    await return_model.updateOne({_id: return_data._id}, {$set: {status: return_data.status, rejection_reason: rejection_reason}})
    return res.status(200).json({success: true, message: "Return status updated successfully"});
};

module.exports = {
    load_orders,
    set_order_status,
    load_returns,
    update_return,
    get_orders
}