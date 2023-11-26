var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fs = require('fs');
var bodyParser = require('body-parser');

var atcRouter       = require('./routes/api/atc');
var airbasesRouter  = require('./routes/api/airbases');
var elevationRouter = require('./routes/api/elevation');
var databasesRouter = require('./routes/api/databases');
var indexRouter     = require('./routes/index');
var uikitRouter     = require('./routes/uikit');
var usersRouter     = require('./routes/users');
var resourcesRouter = require('./routes/resources');
var pluginsRouter   = require('./routes/plugins');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/atc', atcRouter);
app.use('/api/airbases', airbasesRouter);
app.use('/api/elevation', elevationRouter);
app.use('/api/databases', databasesRouter);
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
var demoDataGenerator = new DemoDataGenerator(app, config);



