const path = require('path');
const fs = require('fs');
const brands = require('../../models/brand_model');
const timer = require('../../utils/time');


const add_brand_form = async (req, res) => {
    try {
        const {name, description} = req.body;
        const image = req.file.filename;
        const exists = await brands.findOne({name: {$regex: new RegExp(`^${name}$`, 'i')}});
        if (exists) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Error deleting file:", err);
                console.log("File deleted successfully");
            });
            return res.status(400).json({success: false, message: "Brand already exists"});
        }
        
        const brand = new brands({name, description, image});
        await brand.save();
        return res.status(201).json({success: true, message: "Brand added"});
    } catch (err) {
        console.error("Error in add brand:", err);
        return res.status(500).json({success: false, message: "An error occurred"});
    }
}

const load_brands = async (req, res) => {
    return res.render(
        "admin/brands", 
        {
            title: "Brands",
            page: "Brands"
        }
    );
}

const get_brands = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.body;
        const all_brands = await brands.find().sort({createdAt: -1}).skip((page - 1) * limit).limit(Number(limit));
        const total = await brands.countDocuments();
        return res.status(200).json( 
            {
                success: true,
                brands: all_brands,
                totalPages: Math.ceil(total / limit),
                currentPage: Number(page),
            }
        );
    } catch (error) {
        console.log("Error in getting brands", error);
        return res.status(500).json({success: false, message: "An error occurred"});
    }
}

const edit_brands = async (req, res) => {
    try {
        const {id, name, description, status} = req.body;
        const brand = await brands.findOne({_id: id});
        if (req.file) {
            fs.unlink(path.join(__dirname, "../uploads", brand.image), (err) => {
                if (err) console.error("Error deleting file:", err);
                console.log("File deleted successfully");
            });
        }
        const data = req.file ? {name: name, description: description, status: status, image: req.file.filename, updatedAt: Date.now()} : {name: name, description: description, status: status, updatedAt: Date.now()};
        await brands.updateOne({_id: id}, {$set: data});
        return res.status(200).json({success: true, message: "Brand updated successfully"});
    } catch (err) {
        console.log(err);
        return res.status(500).json({success: false, message: "An error occurred"});
    }
};

const delete_brand = async (req, res) => {
    const { id } = req.params;
    const exists = await brands.findOne({_id: id})
    if (!exists) {
        return res.status(400).json({success: false, message: "Invalid request"});
    }
    await brands.deleteOne({_id: id});
    fs.unlink(path.join(__dirname, "../uploads", exists.image), (err) => {
        if (err) console.error("Error deleting file:", err);
        console.log("File deleted successfully");
    });
    return res.status(200).json({success: true, message: "Brand deleted successfully"});
};


module.exports = {
    add_brand_form,
    load_brands,
    get_brands,
    edit_brands,
    delete_brand,
}