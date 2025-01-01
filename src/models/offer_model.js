const cron = require('node-cron');
const mongoose = require('mongoose');

const Schema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['products', 'category']
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
}, {timestamps: {createdAt: "createdAt", updatedAt: "updatedAt"}});

const Offer = mongoose.model('Offer', Schema);

cron.schedule('0 * * * *', async () => {
    try {
        const now = new Date();
        const updated = await Offer.updateMany(
            { expiry: { $lt: now }, status: true },
            { $set: { status: false } }
        );
        console.log(`Updated ${updated.modifiedCount} expired discounts.`);
    } catch (error) {
        console.error("Error updating expired discounts:", error);
    }
});

module.exports = Offer;