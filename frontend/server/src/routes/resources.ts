import express = require('express');
import fs = require('fs');
const router = express.Router();

module.exports = function (configLocation) {
    router.get('/config', function (req, res, next) {
        if (fs.existsSync(configLocation)) {
            let rawdata = fs.readFileSync(configLocation, "utf-8");
            const config = JSON.parse(rawdata);
            res.send(JSON.stringify({...config.frontend, ...(config.audio ?? {}) }));
            res.end()
        } else {
            res.sendStatus(404);
        }
    });
    
    return router;
}