const express = require('express');	
const controller = require('../controllers/admin_controller');
const auth = require('../middlewares/admin_authentication');
const user = require("../models/user_model");
const brand = require("../models/brand_model");
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

routes.get("/products", auth.authenticateAdmin, (req, res) => {
    return res.render("admin/products", {title: "Products", page: "Products"});
});

routes.get("/add-product", auth.authenticateAdmin, async (req, res) => {
    const categories = [
        {
            name: "Laptop"
        }, 
        {
            name: "PC"
        }
    ]

    const brands = await brand.find({});
    return res.render(
        "admin/add_product", 
        {
            title: "Products", 
            page: "Add Product", 
            categories, 
            brands
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

routes.get("/offers", auth.authenticateAdmin, (req, res) => {
    return res.render("admin/offers", {title: "Offers", page: "Offers"});
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
routes.post("/edit-user", auth.authenticateAdmin, controller.edit_user);
routes.post("/delete-user", auth.authenticateAdmin, controller.delete_user);
routes.post("/add-product", multer.array("images"), controller.add_product_form);
routes.post("/add-brand", multer.single("image"), controller.add_brand_form);
routes.post("/edit-brand", multer.single("image"), controller.edit_brands);
routes.delete("/delete-brand/:id", controller.delete_brand);	
routes.post("/add-category", multer.single("image"), controller.add_category_form);
routes.post("/edit-category", multer.single("image"), controller.edit_category);
routes.delete("/delete-category/:id", controller.delete_category);	

module.exports = routes;