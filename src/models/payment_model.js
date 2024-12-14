const mongoose = require('mongoose');

const Schema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
        enum: ['pending', 'success', 'failed'],
        default: 'pending',
        required: true
    },
    orders: {
        type: [mongoose.Schema.Types.ObjectId],
        required: false,
    }
}, {timestamps: {createdAt: "createdAt", updatedAt: "updatedAt"}});

module.exports = mongoose.model('Payment', Schema);