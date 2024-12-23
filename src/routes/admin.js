const express = require('express');	
const controller = require('../controllers/admin_controller');
const auth = require('../middlewares/admin_authentication');
const user_model = require("../models/user_model");
const category_model = require("../models/category_model");
const brand_model = require("../models/brand_model");
const offer_model = require("../models/offer_model");
const product_model = require("../models/product_model");
const order_model = require("../models/order_model");
const payment_model = require("../models/payment_model");
const multer = require('../utils/multer');
const time = require('../utils/time');
const currency = require('../utils/currency');

const routes = express.Router();


routes.get("/login", (req, res) => {
    const error_message = req.session.error || null;
    req.session.error = null;
    console.error(error_message);
    return res.render("admin/login", {title: "Login", error_message})
});

routes.get("/dashboard", auth.authenticateAdmin, async (req, res) => {
    return res.render("admin/dashboard", {title: "Dashboard", page: "Dashboard"});
});

routes.get("/products", auth.authenticateAdmin, controller.load_products);

routes.get("/add-product", auth.authenticateAdmin, async (req, res) => {
    const categories = await category_model.find({});
    const brands = await brand_model.find({});
    const offers = await offer_model.find({});
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
    const categories = await category_model.find({});
    const brands = await brand_model.find({});
    const offers = await offer_model.find({});
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

routes.get("/add-category", auth.authenticateAdmin, async (req, res) => {
    const offers = await offer_model.find({});
    return res.render("admin/add_category", {title: "Categories", page: "Create Category", offers});
})

routes.get("/orders", auth.authenticateAdmin, controller.load_orders);

routes.get("/order/:id", auth.authenticateAdmin, async (req, res) => {
    const {id} = req.params;
    const order = await order_model.findOne({_id: id}).populate('user_id', 'first_name last_name email addresses phone_number');
    const address = order.user_id.addresses.find(v => v._id.toString() == order.address.toString());
    return res.render("admin/order_details", {title: "Orders", page: "Order Details", order, time, address, currency});
})

routes.get("/brands", auth.authenticateAdmin, controller.load_brands);

routes.get("/add-brand", auth.authenticateAdmin, (req, res) => {
    return res.render("admin/add_brand", {title: "Brands", page: "Create Brand"});
})

routes.get("/customers", auth.authenticateAdmin, controller.load_user);

routes.get("/create-offer", auth.authenticateAdmin, (req, res) => {
    return res.render("admin/create_offer", {title: "Offers", page: "Create Offer"});
});

routes.get("/coupons", auth.authenticateAdmin, controller.load_coupons);
routes.get("/edit-coupon/:id", auth.authenticateAdmin, controller.edit_coupon);

routes.get("/create-coupon", auth.authenticateAdmin, (req, res) => {
    return res.render("admin/create_coupon", {title: "Coupons", page: "Create Coupons"});
});


routes.get("/reviews", auth.authenticateAdmin, (req, res) => {
    return res.render("admin/reviews", {title: "Reviews", page: "Reviews"});
});

routes.get("/settings", auth.authenticateAdmin, (req, res) => {
    return res.render("admin/settings", {title: "Settings", page: "Settings"});
});

routes.get("/sales-report", auth.authenticateAdmin, (req, res) => {
    return res.render("admin/sales_report", {title: "Sales Report", page: "Sales Report"});
});

routes.get("/returns", auth.authenticateAdmin, controller.load_returns);
routes.post("/update-return", auth.authenticateAdminApI, controller.update_return);

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
routes.patch("/order/:id", auth.authenticateAdminApI, controller.set_order_status);
routes.post("/create-coupon", auth.authenticateAdminApI, controller.add_coupon);
routes.post("/edit-coupon", auth.authenticateAdminApI, controller.edit_coupon_form);
routes.delete("/coupons/:id", auth.authenticateAdminApI, controller.delete_coupon);
routes.post("/get-reports", auth.authenticateAdminApI, controller.get_reports);
routes.post("/sales-reports", controller.get_sales_report);

module.exports = routes;