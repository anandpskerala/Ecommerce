const user_model = require('../../models/user_model');
const offer_model = require('../../models/offer_model');
const cart_model = require('../../models/cart_model');
const product_model = require('../../models/product_model');


const add_to_cart = async (req, res) => {
    const { product_id, quantity, color, variant_id } = req.body;

    const user = await user_model.findOne({ _id: req.session.user.id });
    if (!user) {
        return res.json({ success: false, message: 'User not found' });
    }

    const product = await product_model.findOne({ _id: product_id });
    if (!product) {
        return res.json({ success: false, message: 'Product not found' });
    }

    const variant = product.variants.id(variant_id);
    if (!variant) {
        return res.json({ success: false, message: 'Variant not found' });
    }

    const selected_color = variant.colors.find(c => c.color.toLowerCase() === color.toLowerCase());
    if (!selected_color) {
        return res.json({ success: false, message: 'Color not found for the selected variant' });
    }

    if (selected_color.quantity < quantity) {
        return res.json({ success: false, message: 'Insufficient quantity in stock' });
    }

    const offer = await offer_model.findOne({ name: product.offer });
    const price = offer 
        ? (quantity * selected_color.price - Math.ceil(selected_color.price * offer.discount / 100)) 
        : quantity * selected_color.price;
    
    let cart_options;
    if (offer) {
        cart_options = {
            user: user.id,
            product: product._id,
            name: product.title,
            price: price,
            variant: variant.name,
            quantity: quantity,
            color: selected_color.color,
            image: product.images[0],
            discount: quantity * Math.ceil(selected_color.price * offer.discount / 100),
        };
    } else {
        cart_options = {
            user: user.id,
            product: product._id,
            name: product.title,
            price: price,
            variant: variant.name,
            quantity: quantity,
            color: selected_color.color,
            image: product.images[0],
        };
    }

    const cart = await cart_model.create(cart_options);

    return res.status(200).json({ success: true, message: 'Product added to cart successfully' });
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

const update_cart_quantity = async (req, res) => {
    const {cart_id, quantity} = req.body;
    const cart = await cart_model.findOne({_id: cart_id});
    if (!cart) {
        return res.json({ success: false, message: "Cart not found" });
    }
    await cart_model.updateOne({_id: cart_id}, {$set: {quantity: quantity}})
    return res.json({ success: true, message: "Cart quantity updated successfully" });
};

module.exports = {
    add_to_cart,
    remove_from_cart,
    update_cart_quantity,
}