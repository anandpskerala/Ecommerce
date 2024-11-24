const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }, 
    role: {
        type: String,
        enum: ['admin', 'superadmin', 'staff'],
        default: 'admin'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

Schema.methods.comparePassword = async function (password) {
    const result = await bcrypt.compare(password, this.password)
    return result;
};

module.exports = mongoose.model('Admin', Schema);