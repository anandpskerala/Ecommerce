const mongoose = require('mongoose');
const cron = require('node-cron');

const Schema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expires: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
        expires: 86400
    }
})

const Spin = mongoose.model('Spin', Schema);

cron.schedule('0 * * * *', async () => {
    try {
        const now = new Date();
        const result = await Spin.deleteMany({ expires: { $lte: now } });
        console.log(`Deleted ${result.deletedCount} expired spins.`);
    } catch (error) {
        console.error("Error deleting expired spins:", error);
    }
});
module.exports = Spin;