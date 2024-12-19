const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    description: {
        type: String,
        required: true
    }
}, {timestamps: {createdAt: "createdAt", updatedAt: "updatedAt"}});

const Schema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        default: 0
    },
    transactions: {
        type: [transactionSchema],
        default: []
    },
}, {timestamps: {createdAt: "createdAt", updatedAt: "updatedAt"}});


module.exports = mongoose.model('Wallet', Schema);