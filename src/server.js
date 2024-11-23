const express = require('express');
const session = require('express-session');
const path = require('path');
const body_parser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('morgan');
const no_cache = require('./middlewares/nocache');
const connectDB = require('./connect_db');
const user_routes = require("./routes/users");
const profile_routes = require("./routes/profile");

dotenv.config();
connectDB();

const app = express();
const port = process.env.PORT || 5000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(no_cache);
app.use(cors());
app.use(logger('[:method]   -  :url  -  :response-time ms'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(body_parser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60,
        httpOnly: true,
    },
}));

app.use('/', user_routes);
app.use('/user', profile_routes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})