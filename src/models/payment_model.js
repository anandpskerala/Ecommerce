const mongoose = require('mongoose');

const Schema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order_number: {
        type: String,
        required: false
    },
    method: {
        type: String,
        enum: ['razorpay', 'wallet', 'cod'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed', 'refund'],
        default: 'pending',
        required: true
    },
    orders: {
        type: [mongoose.Schema.Types.ObjectId],
        required: false,
    },
    coupon_discount: {
        type: Number,
        required: false,
        default: 0
    },
    delivery_fee: {
        type: Number,
        required: false,
        default: 0
    },
    razorpay_order_id: {
        type: String,
        required: false
    },
    razorpay_payment_id: {
        type: String,
        required: false
    },
    razorpay_signature: {
        type: String,
        required: false
    }
}, {timestamps: {createdAt: "createdAt", updatedAt: "updatedAt"}});

function generateOrderNumber(prefix = "ORD") {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${randomPart}`;
}

Schema.pre('save', function(next) {
    if (!this.isNew) return next();
    this.order_number = generateOrderNumber();
    next();
});

module.exports = mongoose.model('Payment', Schema);