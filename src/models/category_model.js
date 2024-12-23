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
    offer: {
        type: String
    },
    image: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    }
}, {timestamps: {createdAt: "createdAt", updatedAt: "updatedAt"}})

module.exports = mongoose.model('Categories', Schema);