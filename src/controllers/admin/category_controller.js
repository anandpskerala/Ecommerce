const path = require('path');
const fs = require('fs');
const category = require('../../models/category_model');
const timer = require('../../utils/time');
const offer_model = require('../../models/offer_model');


const add_category_form = async (req, res) => {
    try {
        const {name, description} = req.body;
        const image = req.file.filename;
        const exists = await category.findOne({name: {$regex: new RegExp(`^${name}$`, 'i')}});
        if (exists) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Error deleting file:", err);
                console.log("File deleted successfully");
            });
            return res.status(400).json({success: false, message: "Category already exists"});
        }
        
        const cate = new category({name, description, image});
        await cate.save();
        return res.status(201).json({success: true, message: "Category added"});
    } catch (err) {
        console.error("Error in add brand:", err);
        return res.status(500).json({success: false, message: "An error occurred" + err});
    }
}

const load_category = async (req, res) => {
    return res.render(
        "admin/categories", 
        {
            title: "Categories", 
            page: "Categories", 
        }
    );
}

const get_categories = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.body;
        const categories = await category.find().sort({createdAt: -1}).skip((page - 1) * limit).limit(Number(limit));
        const offers = await offer_model.find({type: "category"});
        const total = await category.countDocuments();
        return res.status(200).json(
            {
                success: true,
                categories,
                offers,
                totalPages: Math.ceil(total / limit),
                currentPage: Number(page),
            }
        );
    } catch (error) {
        console.log("Error in getting categories", error)
        return res.status(500).json({success: false, message: "An error occurred"});
    }
}

const edit_category = async (req, res) => {
    try {
        const {id, name, description, status, offer} = req.body;
        const cate = await category.findOne({_id: id});
        if (req.file) {
            fs.unlink(path.join(__dirname, "../uploads", cate.image), (err) => {
                if (err) console.error("Error deleting file:", err);
                console.log("File deleted successfully");
            });
        }

        const data = req.file ? {name: name, description: description, status: status, image: req.file.filename, offer, updatedAt: Date.now()} : {name: name, description: description, status: status, offer, updatedAt: Date.now()};
        await category.updateOne({_id: id}, {$set: data});
        return res.status(200).json({success: true, message: "Category updated successfully"});
    } catch (err) {
        console.log(err);
        return res.status(500).json({success: false, message: "An error occurred"});
    }
};

const delete_category = async (req, res) => {
    const { id } = req.params;
    const exists = await category.findOne({_id: id})
    if (!exists) {
        return res.status(400).json({success: false, message: "Invalid request"});
    }
    await category.deleteOne({_id: id});
    fs.unlink(path.join(__dirname, "../uploads", exists.image), (err) => {
        if (err) console.error("Error deleting file:", err);
        console.log("File deleted successfully");
    });
    return res.status(200).json({success: true, message: "Category deleted successfully"});
};

module.exports = {
    add_category_form,
    load_category,
    get_categories,
    edit_category,
    delete_category,
};