module.exports = function (configLocation) {
    /* Requires */
    var express = require('express');
    var path = require('path');
    var logger = require('morgan');
    var fs = require('fs');
    var bodyParser = require('body-parser');
    const { createProxyMiddleware } = require('http-proxy-middleware');

    /* Default routers */
    var atcRouter = require('./routes/api/atc');
    var airbasesRouter = require('./routes/api/airbases');
    var elevationRouter = require('./routes/api/elevation')(configLocation);
    var databasesRouter = require('./routes/api/databases')(path.join(path.dirname(configLocation), "..", "Mods", "Services", "Olympus", "databases"));
    var indexRouter = require('./routes/index');
    var uikitRouter = require('./routes/uikit');
    var usersRouter = require('./routes/users');
    var resourcesRouter = require('./routes/resources')(configLocation);
    var pluginsRouter = require('./routes/plugins');

    /* Load the config and create the express app */
    let config = {}
    console.log(`Loading configuration file from ${configLocation}`)
    if (fs.existsSync(configLocation)){
        let rawdata = fs.readFileSync(configLocation);
        config = JSON.parse(rawdata);
    }
    else {
        console.error("Error loading configuration file.")
        return undefined;
    }
    var app = express();

    var backendAddress = config["backend"]["address"];
    
    /* Define middleware */
    app.use(logger('dev'));
    app.use('/olympus', createProxyMiddleware({ target: `http://${backendAddress === '*'? 'localhost': backendAddress}:${config["backend"]["port"]}`, changeOrigin: true }));
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    app.use(express.static(path.join(__dirname, 'public')));

    /* Apply routers */
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

    return app;
}




