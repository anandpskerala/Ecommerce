const mongoose = require('mongoose');
const mailer = require('../utils/mailer');

const Schema = new mongoose.Schema({
    email: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiry: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 2 * 60 * 1000),
      expires: 60 * 2
    }
}, {timestamps: {createdAt: "createdAt", updatedAt: "updatedAt"}});

async function sendVerificationEmail(email, otp) {
    try {
      const mailResponse = await mailer(
        email,
        "Verification Email",
        `<h1>Please confirm your OTP</h1>
        <br><br>
        <p>Here is your OTP code: ${otp}</p>`
      );
    } catch (error) {
      console.log("Error occurred while sending email: ", error);
      throw error;
    }
}

Schema.pre("save", async function (next) {
    if (this.isNew) {
      //await sendVerificationEmail(this.email, this.otp);
    }
    next();
});

module.exports = mongoose.model("Otp", Schema);
