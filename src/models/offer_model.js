const { name } = require('ejs');
const mongoose = require('mongoose');

const Schema = mongoose.Schema({
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
    status: {
        type: Boolean,
        default: true
    },
    discount: {
        type: Number,
        required: true
    },
    min_amount: {
        type: Number,
        required: true
    }
}, {timestamps: {createdAt: "createdAt", updatedAt: "updatedAt"}})

module.exports = mongoose.model('Offer', Schema);