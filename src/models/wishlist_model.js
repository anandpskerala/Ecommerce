const mongoose = require('mongoose');

const Schema = mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    variant_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    color: {
        type: String,
        required: true
    }
}, {timestamps: {createdAt: "createdAt", updatedAt: "updatedAt"}})

module.exports = mongoose.model('Wishlist', Schema);