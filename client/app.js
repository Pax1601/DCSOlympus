var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fs = require('fs');

var atcRouter       = require('./routes/api/atc');
var airbasesRouter  = require('./routes/api/airbases');
var indexRouter     = require('./routes/index');
var uikitRouter     = require('./routes/uikit');
var usersRouter     = require('./routes/users');
var resourcesRouter = require('./routes/resources');
var pluginsRouter   = require('./routes/plugins');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/atc', atcRouter);
app.use('/api/airbases', airbasesRouter);
app.use('/plugins', pluginsRouter)
app.use('/users', usersRouter);
app.use('/uikit', uikitRouter);
app.use('/resources', resourcesRouter);

app.set('view engine', 'ejs');

let rawdata = fs.readFileSync('../olympus.json');
let config = JSON.parse(rawdata);
if (config["server"] != undefined)
    app.get('/config', (req, res) => res.send(config["server"]));

module.exports = app;

const DemoDataGenerator = require('./demo.js');
var demoDataGenerator = new DemoDataGenerator(app);



