const express = require('express');	
const controller = require('../controllers/admin_controller');
const auth = require('../middlewares/admin_authentication');
const user = require("../models/user_model");
const category = require("../models/category_model");
const brand = require("../models/brand_model");
const offer = require("../models/offer_model");
const product_model = require("../models/product_model");
const multer = require('../utils/multer');

const routes = express.Router();


routes.get("/login", (req, res) => {
    const error_message = req.session.error || null;
    req.session.error = null;
    console.error(error_message);
    return res.render("admin/login", {title: "Login", error_message})
});

routes.get("/dashboard", auth.authenticateAdmin, (req, res) => {
    return res.render("admin/dashboard", {title: "Dashboard", page: "Dashboard"});
});

routes.get("/products", auth.authenticateAdmin, controller.load_products);

routes.get("/add-product", auth.authenticateAdmin, async (req, res) => {
    const categories = await category.find({});
    const brands = await brand.find({});
    const offers = await offer.find({});
    return res.render(
        "admin/add_product", 
        {
            title: "Products", 
            page: "Add Product", 
            categories, 
            brands,
            offers
        }
    );
});

routes.get("/edit-product/:id", auth.authenticateAdmin, async (req, res) => {
    const {id} = req.params; 
    const categories = await category.find({});
    const brands = await brand.find({});
    const offers = await offer.find({});
    const product = await product_model.findOne({_id: id});
    return res.render(
        "admin/edit_product", 
        {
            title: "Products", 
            page: "Edit Product", 
            categories, 
            brands,
            offers,
            product
        }
    );
});

routes.get("/categories", auth.authenticateAdmin, controller.load_category);

routes.get("/add-category", auth.authenticateAdmin, (req, res) => {
    return res.render("admin/add_category", {title: "Categories", page: "Create Category"});
})

routes.get("/orders", auth.authenticateAdmin, (req, res) => {
    return res.render("admin/orders", {title: "Orders", page: "Orders"});
});

routes.get("/brands", auth.authenticateAdmin, controller.load_brands);

routes.get("/add-brand", auth.authenticateAdmin, (req, res) => {
    return res.render("admin/add_brand", {title: "Brands", page: "Create Brand"});
})

routes.get("/customers", auth.authenticateAdmin, controller.load_user);

routes.get("/create-offer", auth.authenticateAdmin, (req, res) => {
    return res.render("admin/create_offer", {title: "Offers", page: "Create Offer"});
});

routes.get("/coupons", auth.authenticateAdmin, (req, res) => {
    return res.render("admin/coupons", {title: "Coupons", page: "Coupons"});
});

routes.get("/reviews", auth.authenticateAdmin, (req, res) => {
    return res.render("admin/reviews", {title: "Reviews", page: "Reviews"});
});

routes.get("/settings", auth.authenticateAdmin, (req, res) => {
    return res.render("admin/settings", {title: "Settings", page: "Settings"});
});

routes.post("/login", controller.admin_login);
routes.get("/logout", controller.admin_logout);
routes.get("/offers", auth.authenticateAdminApI, controller.load_offers);
routes.post("/edit-user", auth.authenticateAdminApI, controller.edit_user);
routes.post("/delete-user", auth.authenticateAdminApI, controller.delete_user);
routes.post("/add-product", multer.array("images"), auth.authenticateAdminApI, controller.add_product_form);
routes.post("/edit-product", multer.none(), auth.authenticateAdminApI, controller.edit_product_form);
routes.post("/add-brand", multer.single("image"), auth.authenticateAdminApI, controller.add_brand_form);
routes.post("/edit-brand", multer.single("image"), auth.authenticateAdminApI, controller.edit_brands);
routes.delete("/delete-brand/:id", auth.authenticateAdminApI, controller.delete_brand);	
routes.post("/add-category", multer.single("image"), auth.authenticateAdminApI, controller.add_category_form);
routes.post("/edit-category", multer.single("image"), auth.authenticateAdminApI, controller.edit_category);
routes.delete("/delete-category/:id", auth.authenticateAdminApI, controller.delete_category);
routes.post("/create-offer", auth.authenticateAdminApI, controller.create_offer);
routes.delete("/delete-offer/:id", auth.authenticateAdminApI, controller.delete_offer);
routes.delete("/delete-product/:id", auth.authenticateAdminApI, controller.delete_product);
routes.post("/remove-product-image", auth.authenticateAdminApI, controller.remove_product_image);
routes.post("/edit-product-image", multer.array("images"), auth.authenticateAdminApI, controller.add_product_image);
routes.post("/product-options", auth.authenticateAdminApI, controller.product_options);

module.exports = routes;