const mongoose = require('mongoose');

const Schema  = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    activation: {
        type: Date,
        required: true
    },
    expiry: {
        type: Date,
        required: true,
    },
    discount: {
        type: Number,
        required: true
    },
    min_amount: {
        type: Number,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
    type: {
        type: String,
        required: true,
        enum: ['single', 'multiple']
    },
    limit: {
        type: Number,
        required: true
    },
    users: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    }
}, {timestamps: {createdAt: "createdAt", updatedAt: "updatedAt"}})

module.exports = mongoose.model('Coupon', Schema);