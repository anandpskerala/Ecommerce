const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: { 
        type: String, 
        required: false,
        default: ''
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    google_id: {
        type: String,
        required: false,
    },
    password: {
        type: String,
        required: false
    },
    phone_number: { 
        type: String 
    },
    is_blocked: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {timestamps: {createdAt: "createdAt", updatedAt: "updatedAt"}});

Schema.pre("save", async function(next) {
    if (!this.isModified('password')) return next();
    if (!this.googleId && !this.password) return next(new Error('Either googleId or password must be provided'));
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
})

Schema.methods.comparePassword = async function (password) {
    const result = await bcrypt.compare(password, this.password)
    return result;
};


const userModel = new mongoose.model('User', Schema)


module.exports = userModel;