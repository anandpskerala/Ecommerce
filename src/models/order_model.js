const mongoose = require('mongoose');

const Schema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    order_number: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        required: false,
        default: 0
    },
    variant: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['processing', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'processing'
    },
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        required: false
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    cancel_reason: {
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
})

module.exports = mongoose.model('Order', Schema);