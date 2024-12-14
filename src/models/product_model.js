const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
    },
});

const Schema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        stock: {
            type: Boolean,
            default: true,
        },
        category: {
            type: String,
            required: true,
        },
        brand: {
            type: String,
            required: true,
        },
        offer: {
            type: String,
        },
        colors: {
            type: [String],
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        variants: {
            type: [variantSchema],
        },
        images: {
            type: [String],
            default: []
        },
        listed: {
            type: Boolean,
            default: true
        },
        ordered: {
            type: Number,
            default: 0
        }
    },
    { timestamps: {createdAt: "createdAt", updatedAt: "updatedAt"} }
);

module.exports = mongoose.model('Product', Schema);