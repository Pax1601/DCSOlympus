var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fs = require('fs');

var indexRouter = require('./routes/index');
var uikitRouter = require('./routes/uikit');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/uikit', uikitRouter);

app.set('view engine', 'ejs');

let rawdata = fs.readFileSync('../olympus.json');
let config = JSON.parse(rawdata);
app.get('/config', (req, res) => res.send(config));

module.exports = app;

const DemoDataGenerator = require('./demo.js');
var demoDataGenerator = new DemoDataGenerator(10);
app.get('/demo/units', (req, res) => demoDataGenerator.units(req, res));
app.get('/demo/logs', (req, res) => demoDataGenerator.logs(req, res));
app.get('/demo/bullseyes', (req, res) => demoDataGenerator.bullseyes(req, res));
app.get('/demo/airbases', (req, res) => demoDataGenerator.airbases(req, res));
app.get('/demo/mission', (req, res) => demoDataGenerator.mission(req, res));

