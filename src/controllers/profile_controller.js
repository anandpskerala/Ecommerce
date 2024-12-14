const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const otp_model = require('../models/otp_model');
const user_model = require('../models/user_model');
const review_model = require('../models/review_model');
const offer_model = require('../models/offer_model');
const cart_model = require('../models/cart_model');
const product_model = require('../models/product_model');
const payment_model = require('../models/payment_model');
const order_model = require('../models/order_model');

const generate_otp = () => {
    return crypto.randomInt(1000, 9999);
}

const send_otp = async (req, res) => {
    const {email} = req.body;
    const result = await otp_model.findOne({email: email.toLowerCase()});
    if (!result) {
        const user = await user_model.findOne({email: email.toLowerCase()});
        if (!user.password) {
            req.session.error = "Email doesn't exists";
            return res.redirect("/forgot-password");
        }
        const otp = new otp_model({email: email.toLowerCase(), otp: generate_otp()});
        console.log(otp);
        let result = await otp.save();
        req.session.otp = {email: email.toLowerCase(), expiry: result.expiry};
        return res.redirect("/user/verify-otp");
    } else {
        req.session.error = "Please wait for sometime to try again";
        return res.redirect("/forgot-password");
    }
}

const verify_otp = async (req, res) => {
    const {otp} = req.body;
    if (!req.session.otp) {
        req.session.error = "Session expired. Please try again";
        return res.redirect("/forgot-password");
    }
    const {email} = req.session.otp;
    const result = await otp_model.findOne({email, otp});
    if (result) {
        return res.redirect("/user/reset-password");
    } else {
        req.session.error = "Invalid OTP";
        return res.redirect("/user/verify-otp");
    }
};

const verify_signup = async (req, res) => {
    const {otp} = req.body;
    if (!req.session.otp) {
        req.session.error = "Session expired. Please try again";
        return res.redirect("/signup");
    }
    const {user} = req.session.otp;
    const result = await otp_model.findOne({email: user.email.toLowerCase(), otp});
    if (result) {
        const user_model = new user_model({...user})
        let result = await user_model.save();

        if (req.session.admin) {
            req.session.user = {
                id: result._id,
                first_name: result.first_name,
                last_name: result.last_name,
                email: result.email,
            };
            return res.redirect("/");
        } else {
            req.session.regenerate((err) => {
                if (err) {
                    console.error("Error regenerating session: " + err);
                    req.session.error = "Session Error. Please try again.";
                    return res.redirect("/signup");
                }
                
                req.session.user = {
                    id: result._id,
                    first_name: result.first_name,
                    last_name: result.last_name,
                    email: result.email,
                };
                
            return res.redirect("/");
            });
        }
    } else {
        req.session.error = "Invalid OTP";
        return res.redirect("/user/verify-signup");
    }
};

const reset_password = async (req, res) => {
    const {password} = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashed_password = await bcrypt.hash(password, salt);
    if (!req.session.otp) {
        req.session.error = "Session expired. Please try again";
        return res.redirect("/forgot-password");
    }
    const { email } = req.session.otp;
    const user = await user_model.findOne({email});
    if (user) {
        await user_model.updateOne({email}, {$set: {password: hashed_password}});
        delete req.session.otp;
        return res.redirect("/login");
    } else {
        req.session.error = "Failed to reset password";
        return res.redirect("/user/reset-password");
    }
}

const change_profile_picture = async (req, res) => {
    try {
        const {id} = req.body;
        const image = req.file.filename;
        const user = await user_model.findOne({_id: id});
        if (user && user.image) {
            fs.unlink(path.join(__dirname, "../uploads", user.image), (err) => {
                if (err) console.error("Error deleting file:", err);
                console.log("File deleted successfully");
            });
        }
        if (!req.file) {
            return res.status(404).json({success: false, message: "No Image found. Try again"});
        }
        await user_model.updateOne({_id: id}, {$set: {image}});
        return res.status(200).json({success: true, message: "Profile picture updated successfully"});
    } catch (err) {
        console.log(err);
        return res.status(500).json({success: false, message: "Internal Error Please try again"});
    }
};

const remove_profile_picture = async (req, res) => {
    try {
        const {id} = req.body;
        const user = await user_model.findOne({_id: id});
        if (user && user.image) {
            fs.unlink(path.join(__dirname, "../uploads", user.image), (err) => {
                if (err) console.error("Error deleting file:", err);
                console.log("File deleted successfully");
            });
        }
        await user_model.updateOne({_id: id}, {$unset: {image: ""}});
        return res.status(200).json({success: true, message: "Profile picture removed successfully"});
    } catch (err) {
        console.log(err);
        return res.status(500).json({success: false, message: "Internal Server Error Please try again"});
    }
};

const change_password = async (req, res) => {
    const {password, current_password } = req.body;
    const exists = await user_model.findOne({_id: req.session.user.id});
    if (!exists) {
        return res.status(404).json({success: false, message: `User not found`});
    }

    const comparePassword = await bcrypt.compare(current_password, exists.password);

    if (!comparePassword) {
        return res.status(400).json({success: false, message: "Current password is incorrect"});
    }
    const salt = await bcrypt.genSalt(10);
    const hashed_password = await bcrypt.hash(password, salt);
    await user_model.updateOne({_id: req.session.user.id}, {$set: {password: hashed_password}});
    return res.status(200).json({success: true, message: "Password updated successfully"});
};

const change_phone = async (req, res) => {
    const {phone} = req.body;
    const exists = await user_model.findOne({_id: req.session.user.id});
    if (!exists) {
        return res.status(404).json({success: false, message: `User not found`});
    }
    await user_model.updateOne({_id: req.session.user.id}, {$set: {phone_number: phone}});
    return res.status(200).json({success: true, message: "Phone number updated successfully"});
};

const add_address = async (req, res) => {
    console.log(req.body)
    const {house_address, street_address, city, state, country, zip_code} = req.body;
    const exists = await user_model.findOne({_id: req.session.user.id});
    if (!exists) {
        return res.status(404).json({success: false, message: `User not found`});
    }
    await user_model.updateOne(
        {_id: req.session.user.id}, 
        {$push: {addresses: {
            house_address, 
            street_address,
            city,
            state,
            country,
            zip_code
        }}}
    );
    return res.status(200).json({success: true, message: "Address added successfully"});
};

const delete_address = async (req, res) => {
    const {id} = req.body;
    const exists = await user_model.findOne({_id: req.session.user.id});
    if (!exists) {
        return res.status(404).json({success: false, message: `User not found`});
    }
    await user_model.updateOne(
        {_id: req.session.user.id}, 
        {$pull: {addresses: {_id: id}}}
    );
    return res.status(200).json({success: true, message: "Address deleted successfully"});
};

const update_address = async (req, res) => {
    const {id, house_address, street_address, city, state, country, zip_code} = req.body;
    const exists = await user_model.findOne({_id: req.session.user.id});
    if (!exists) {
        return res.status(404).json({success: false, message: `User not found`});
    }
    await user_model.updateOne(
        {_id: req.session.user.id, "addresses._id": id},
        {$set: {
            'addresses.$.house_address': house_address,
            'addresses.$.street_address': street_address,
            'addresses.$.city': city,
            'addresses.$.state': state,
            'addresses.$.country': country,
            'addresses.$.zip_code': zip_code
        }}
    );
    return res.status(200).json({success: true, message: "Address updated successfully"});
}

const add_review = async (req, res) => {
    const { product_id, comment, rating} = req.body;
    const user = await user_model.findOne({_id: req.session.user.id});
    if (!user) {
        return res.status(404).json({success: false, message: `User not found`});
    }

    const order = await order_model.findOne({user_id: user.id, product_id: product_id});
    if (!order) {
        return res.json({success: false, message: 'You need to order the product to add review'});
    }

    if (order.status != 'delivered' && order.status != 'returned') {
        return res.json({success: false, message: 'You can only add review after the product has been delivered or returned'});
    }

    const review = new review_model({user_id: user.id, product_id, rating, comment});
    await review.save();
    return res.status(200).json({success: true, message: "Review added successfuly"});
};

const add_to_cart = async (req, res) => {
    const { product_id, quantity, color, variant_id} = req.body;
    const user = await user_model.findOne({_id: req.session.user.id});
    if (!user) {
        return res.json({success: false, message: `User not found`});
    }
    const product = await product_model.findOne({_id: product_id});
    if (!product) {
        return res.json({success: false, message: `Product not found`});
    }
    const variant = product.variants.id(variant_id);
    if (!variant) {
        return res.json({success: false, message: `Variant not found`});
    }

    if (variant.quantity < quantity) {
        return res.json({success: false, message: `Insufficient quantity in stock`});
    }

    const offer = await offer_model.findOne({name: product.offer});
    console.log(offer)
    const price =  offer ? (quantity * variant.price - Math.ceil(variant.price * offer.discount /100)): quantity * variant.price;
    const cart = new cart_model({
        user: user.id,
        product: product._id,
        name: product.title,
        price: price,
        variant: variant.name,
        quantity: quantity,
        color: color,
        image: product.images[0],
    })
    await cart.save();
    return res.status(200).json({success: true, message: `Product added to cart successfully`})
};

const remove_from_cart = async (req, res) => {
    const { id } = req.params;
    const user = await user_model.findOne({_id: req.session.user.id});
    if (!user) {
        return res.json({success: false, message: `User not found`});
    }
    await cart_model.deleteOne({user: user._id, _id: id});
    return res.status(200).json({success: true, message: `Product removed from cart successfully`});
};

const add_order = async (req, res) => {
    try {
        const { carts, payment_method, address, price } = req.body;
        console.log("Price:", price);

        if (!carts || !payment_method || !address) {
            return res.json({ success: false, message: "All fields are required" });
        }

        const user = await user_model.findOne({ _id: req.session.user.id });
        if (!user) {
            return res.json({ success: false, message: `User not found` });
        }

        if (payment_method !== "cod") {
            return res.json({ success: false, message: "Only COD payment method is supported" });
        }

        const payment_data = new payment_model({
            user_id: user._id,
            method: payment_method,
            amount: price,
        });
        const payment = await payment_data.save();

        let orders = [];
        const parsedCarts = JSON.parse(carts);

        for (const cartId of parsedCarts) {
            const product_cart = await cart_model.findOne({ _id: cartId });
            if (!product_cart) continue;

            const product = await product_model.findOne({ _id: product_cart.product });
            if (!product) continue;

            let variant = product.variants.find((v) => v.name === product_cart.variant);

            if (!variant) continue;

            if (variant.quantity < product_cart.quantity) {
                return res.json({ success: false, message: `Insufficient quantity in stock for cart item` });
            }

            if (product.offer && product.offer !== "none") {
                const offer = await offer_model.findOne({ name: product.offer });
                variant.price = product_cart.quantity * variant.price - Math.ceil(variant.price * offer.discount / 100);
            } else {
                variant.price = product_cart.quantity * variant.price;
            }

            const order_item = new order_model({
                user_id: user._id,
                product_id: product._id,
                name: product.title,
                variant: variant.name,
                quantity: product_cart.quantity,
                color: product_cart.color,
                image: product_cart.image,
                price: variant.price,
                payment: payment._id,
                address: address,
            });

            const order = await order_item.save();
            orders.push(order._id);


            const variant_data = product.variants.map((v) => {
                if (v.name === variant.name) {
                    v.quantity -= product_cart.quantity;
                }
                return v;
            });

            product.variants = variant_data;
            product.ordered += 1;
            await product.save();

            await cart_model.deleteOne({ _id: product_cart._id });
        }

        await payment_model.updateOne(
            { _id: payment._id },
            { $set: { orders: orders } }
        );

        return res.status(200).json({
            success: true,
            message: "Order placed successfully",
            order_id: payment._id,
        });

    } catch (error) {
        console.error("Error placing order:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while placing the order",
        });
    }
};



const cancel_order = async (req, res) => {
    const { order_id, reason } = req.body;
    const user = await user_model.findOne({_id: req.session.user.id});
    if (!user) {
        return res.json({success: false, message: `User not found`});
    }
    const order = await order_model.findOne({_id: order_id, user_id: user._id});
    if (!order) {
        return res.json({success: false, message: `Order not found`});
    }
    if (order.status!== "processing") {
        return res.json({success: false, message: "Order can only be cancelled in processing state"});
    }
    const payment = await payment_model.findOne({_id: order.payment});
    if (payment.amount == (order.quantity * order.price + 3)) {
        await payment_model.deleteOne({_id: payment._id});
    } else {
        await payment_model.updateOne({_id: payment._id}, {$inc: {amount: -(order.quantity * order.price)}, $pull: {orders: order._id}});
    }
    const product = await product_model.findOne({_id: order.product_id});
    const variant_data = product.variants.map((v) => {
        if (v.name === order.variant) {
            v.quantity += order.quantity;
        }
        return v;
    });
    await product_model.updateOne({_id: order.product_id}, {$set: {variants: variant_data}})
    await order_model.updateOne({_id: order._id}, {$set: {status: 'cancelled', reason}});
    return res.status(200).json({success: true, message: "Order cancelled successfully"});
}

const delete_account = async (req, res) => {
    const { id } = req.session.user;
    const user = await user_model.findOne({ _id: id });
    if (!user) {
        return res.json({ success: false, message: "User not found" });
    }
    await user_model.deleteOne({ _id: user._id });
    return res.status(200).json({ success: true, message: "Account deleted successfully" });
};

const change_name = async (req, res) => {
    const { id } = req.session.user;
    const { first_name, last_name } = req.body;
    const user = await user_model.findOneAndUpdate({ _id: id }, { first_name, last_name });
    if (!user) {
        return res.json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, message: "Name updated successfully", user });
}

module.exports= { 
    send_otp, 
    verify_otp, 
    reset_password, 
    verify_signup, 
    change_profile_picture,
    remove_profile_picture,
    change_password,
    change_phone,
    add_address,
    delete_address,
    update_address,
    add_review,
    add_to_cart,
    remove_from_cart,
    add_order,
    cancel_order,
    delete_account,
    change_name
}; 