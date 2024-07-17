module.exports = function (databasesLocation) {
    const express = require('express');
    const router = express.Router();
    const fs = require("fs");
    const path = require("path");

    router.get('/:type/:name', function (req, res) {
		var contents = fs.readFileSync(path.join(databasesLocation, req.params.type, req.params.name + ".json"));
        res.status(200).send(contents);
    });

    router.put('/save/:type/:name', function (req, res) {
        var dir = path.join(databasesLocation, req.params.type, "old");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        var filepath = path.join(databasesLocation, req.params.type, req.params.name + ".json");
        if (fs.existsSync(filepath)) {
            var newFilepath = path.join(databasesLocation, req.params.type, "old", req.params.name + ".json");
            fs.copyFileSync(filepath, newFilepath);
            if (fs.existsSync(newFilepath)) {
                try {
                    var json = JSON.stringify(req.body.blueprints, null, "\t");
                    fs.writeFileSync(filepath, json, 'utf8');
                    res.send("OK");
                } catch {
                    res.status(422).send("Error");
                }
            } else {
                res.status(422).send("Error");
            }
        } else {
            res.status(404).send('Not found');
        }
    });

    router.put('/reset/:type/:name', function (req, res) {
        var filepath = path.join(databasesLocation, req.params.type, "default", req.params.name + ".json");
        if (fs.existsSync(filepath)) {
            var newFilepath = path.join(databasesLocation, req.params.type, req.params.name + ".json");
            fs.copyFileSync(filepath, newFilepath);
            res.send("OK");
        } else {
            res.status(404).send('Not found');
        }
    });

    router.put('/restore/:type/:name', function (req, res) {
        var filepath = path.join(databasesLocation, req.params.type, "old", req.params.name + ".json");
        if (fs.existsSync(filepath)) {
            var newFilepath = path.join(databasesLocation, req.params.type, req.params.name + ".json");
            fs.copyFileSync(filepath, newFilepath);
            res.send("OK");
        } else {
            res.status(404).send('Not found');
        }
    });

    return router;
}
