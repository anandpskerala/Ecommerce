const crypto = require('crypto');
const mongoose = require('mongoose');

const Schema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    referred_users: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: [],
    },
    amount_earned: {
        type: Number,
        default: 0
    },
    referral_code: {
        type: String,
    },
})

Schema.pre('save', async function (next) {
    const referral = this;

    try {
        const randomCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        referral.referral_code = randomCode;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('Referral', Schema);