const path = require('path');
const fs = require('fs');
const product_model = require('../../models/product_model');
const currency = require("../../utils/currency");


const load_products = async (req, res) => {
    return res.render(
        "admin/products", 
        {
            title: "Products",
            page: "Products", 
        }
    );
};

const get_products = async (req, res) => {
    try {
        const { page = 1, limit = 10, product = "" } = req.body;
        const search_product = product != "" ? {title: {$regex: product}}: {};
        const products = await product_model.find(search_product).sort({createdAt: -1}).skip((page - 1) * limit).limit(Number(limit));
        const total = await product_model.countDocuments(search_product);
        return res.status(200).json(
            {
                success: true,
                products,
                totalPages: Math.ceil(total / limit),
                currentPage: Number(page),
            }
        );
    } catch (error) {
        console.log("Error in getting products", error);
        return res.status(500).json({ success: false, message: "An error occurred" });
    }
};

const add_product_form = async (req, res) => {
    try {
        const { title, stock, category, brand, offer, description, variants } = req.body;

        const parsed_variants = JSON.parse(variants);

        const variant_list = Object.keys(parsed_variants).map((variant_name) => {
            const colors = Object.keys(parsed_variants[variant_name]).map((color) => {
                const { price, quantity } = parsed_variants[variant_name][color];
                return { color, price: parseFloat(price), quantity: parseInt(quantity) };
            });
            return { name: variant_name, colors };
        });

        const files = req.files.map((file) => file.filename);

        const product_data = {
            title,
            stock: stock === "true",
            category,
            brand,
            offer: offer || "none",
            description,
            images: files,
            variants: variant_list,
        };

        const product = await product_model.create(product_data);

        return res.status(200).json({ success: true, message: "Product added successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "An error occurred while adding the product" });
    }
};

const delete_product = async (req, res) => {
    try {
        const { id } = req.params;
        const exists = await product_model.findOne({_id: id});
        if (!exists) {
            return res.status(404).json({success: false, message: "Product not found"});
        }
        await product_model.deleteOne({_id: id});
        for (image in exists.images) {
            fs.unlink(path.join(__dirname, '../uploads', exists.images[image]), (err) => {
                if (err) console.error("Error deleting file:", err);
                console.log("File deleted successfully");
            });
        }
        return res.status(200).json({success: true, message: "Product deleted successfully"});
    } catch (err) {
        console.error("Error in delete product:", err);
        return res.status(500).json({success: false, message: "An error occurred"});
    }
};


const remove_product_image = async (req, res) => {
    try {
        const {id, image} = req.body;
        const product = await product_model.findOne({_id: id});
        if (!product) {
            return res.status(400).json({success: false, message: "Invalid request"});
        }
        await product_model.updateOne({_id: id}, {$pull: {images: image}});
        fs.unlink(path.join(__dirname, "../uploads", image), (err) => {
            if (err) console.error("Error deleting file:", err);
            console.log("File deleted successfully");
        });
        return res.status(200).json({success: true, message: "Image removed successfully"});
    } catch (err) {
        console.error("Error in remove product image:", err);
        return res.status(500).json({success: false, message: "An error occurred"});
    }
}

const add_product_image = async (req, res) => {
    try {
        const { id } = req.body;
        let files = req.files.map((file) => file.filename);
        const product = await product_model.findOne({_id: id});
        if (!product) {
            return res.status(400).json({success: false, message: "Invalid request"});
        }
        await product_model.updateOne({_id: id}, {$push: {images: {$each: files}}});
        return res.status(200).json({success: true, message: "Image added successfully"});
    } catch (err) {
        console.error("Error in add product image:", err);
        return res.status(500).json({success: false, message: "An error occurred"});
    }
}

const product_options = async (req, res) => {
    try {
        const {id, action} = req.body;
        await product_model.updateOne({_id: id}, {$set: {listed: action}});
        return res.status(200).json({success: true, message: `Product ${action == 'true' ? 'listed': 'unlisted'} successfully`});
    } catch (error) {
        console.log("Error in Product otions" + error)
        return res.status(500).json({success: false, message: "An error occurred"});
    }
};

const edit_product_form = async (req, res) => {
    try {
        let { id, variants} = req.body;
        const parsed_variants = JSON.parse(variants);

        const variant_list = Object.keys(parsed_variants).map((variant_name) => {
            const colors = Object.keys(parsed_variants[variant_name]).map((color) => {
                const { price, quantity } = parsed_variants[variant_name][color];
                return { color, price: parseFloat(price), quantity: parseInt(quantity) };
            });
            return { name: variant_name, colors };
        });

        let data = {...req.body, variants: variant_list};
        await product_model.updateOne({_id: id}, {$set: data})
        return res.status(200).json({success: true, message: `Product Updated`})
    } catch (err) {
        console.log("Error in edit product form" + err)
        return res.status(500).json({success: false, message: `An error occurred ${err}`});
    }
};

module.exports = {
    load_products,
    get_products,
    add_product_form,
    delete_product,
    remove_product_image,
    add_product_image,
    product_options,
    edit_product_form,
    product_options
}