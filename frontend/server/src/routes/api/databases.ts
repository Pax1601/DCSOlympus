import express = require('express');
import fs = require("fs");
import path = require("path");

const router = express.Router();

module.exports = function (databasesLocation) {
    router.get('/:type/:name', function (req, res) {
		var contents = fs.readFileSync(path.join(databasesLocation, req.params.type, req.params.name + ".json"));
        res.status(200).send(contents);
    });
    return router;
}
