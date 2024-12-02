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
    image: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
})

module.exports = mongoose.model('Categories', Schema);