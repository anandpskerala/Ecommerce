const mongoose = require('mongoose');
const crypto = require('crypto');

const colorDetailSchema = new mongoose.Schema({
    color: {
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

const variantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    colors: {
        type: [colorDetailSchema],
        required: true,
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
        },
        product_id: {
            type: String,
            required: false
        }
    },
    { timestamps: {createdAt: "createdAt", updatedAt: "updatedAt"} }
);

Schema.pre('save', function(next) {
    if (!this.isNew) return next();
    this.product_id = `PROD-${crypto.randomBytes(4).toString('hex').toUpperCase()}${String(Date.now()).slice(10)}`
    next();
})


module.exports = mongoose.model('Product', Schema);