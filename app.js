var config = require("./lib/config").config;
var router = require("./lib/router.js");
var path = require("path");
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var express = require('express');
var app = exports.app = express();
var session = require('express-session');
var RedisStore = require('connect-redis')(session);

app.use(session({
    store: new RedisStore({ttl: config.sessionTime}),
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.all('*',router);

