const razorpay = require("../utils/razorpay");
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;

const create_payment = async (req, res) => {
    try {
        const { amount } = req.body;
        const user_id = req.session.user.id;
        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: `receipt_${user_id}_${Date.now().toString().slice(-5)}`,
        }

        const order = await razorpay.orders.create(options);
        return res.status(200).json({
            success: true,
            order: {key: RAZORPAY_KEY_ID, ...order},
        });
    } catch (err) {
        console.error("Error creating Razorpay order:", err);
        return res.json({success: false, message: "Payment failed"});
    }

};

const verify_payment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
    const generated_signature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
  
    if (generated_signature === razorpay_signature) {
      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }
};

module.exports = { create_payment, verify_payment };