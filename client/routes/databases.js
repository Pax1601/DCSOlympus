const express = require('express');
const router = express.Router();
const fs = require("fs");
const path = require("path");

router.get('/:type/:name', function (req, res) {
    console.log(req.params.database)
});

router.put('/:type/:name', function (req, res) {
    var filepath = path.join("./public/databases", req.params.type, req.params.name + ".json");
    if (fs.existsSync(filepath)) {
        var newFilepath = filepath + ".old";
        fs.copyFileSync(filepath, newFilepath);
        if (fs.existsSync(newFilepath)) {
            try {
                var json = JSON.stringify(req.body.blueprints);
                fs.writeFileSync(filepath, json, 'utf8');
                res.send('OK')
            } catch {
                res.status(422);
            }
        } else {
            res.status(422);
        }
    } else {
        res.status(404);
    }
});

module.exports = router;
