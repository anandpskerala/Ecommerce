const express = require('express');	
const controller = require('../controllers/admin_controller');

const routes = express.Router();


routes.get("/login", (req, res) => {
    const error_message = req.session.error || null;
    req.session.error = null;
    console.error(error_message);
    return res.render("admin/login", {title: "Login", error_message})
});

routes.get("/dashboard", (req, res) => {
    return res.render("admin/dashboard", {title: "Dashboard", page: "Dashboard"});
});

routes.get("/products", (req, res) => {
    return res.render("admin/products", {title: "Products", page: "Products"});
});

routes.get("/add-product", (req, res) => {
    const categories = [
        {
            name: "Laptop"
        }, 
        {
            name: "PC"
        }
    ]
    return res.render("admin/add_product", {title: "Products", page: "Add Product", categories});
});

routes.get("/categories", (req, res) => {
    return res.render("admin/categories", {title: "Categories", page: "Categories"});
});

routes.get("/orders", (req, res) => {
    return res.render("admin/orders", {title: "Orders", page: "Orders"});
});

routes.get("/brands", (req, res) => {
    return res.render("admin/brands", {title: "Brands", page: "Brands"});
});

routes.get("/customers", (req, res) => {
    return res.render("admin/customers", {title: "Customers", page: "Customers"});
});

routes.get("/offers", (req, res) => {
    return res.render("admin/offers", {title: "Offers", page: "Offers"});
});

routes.get("/coupons", (req, res) => {
    return res.render("admin/coupons", {title: "Coupons", page: "Coupons"});
});

routes.get("/reviews", (req, res) => {
    return res.render("admin/reviews", {title: "Reviews", page: "Reviews"});
});

routes.get("/settings", (req, res) => {
    return res.render("admin/settings", {title: "Settings", page: "Settings"});
});

routes.post("/login", controller.admin_login);

module.exports = routes;