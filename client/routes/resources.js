const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const url = require('url'); 

var theme = "olympus";

router.get('/theme/*', function (req, res, next) {
    if (url.parse(req.url).pathname.slice(-4).toLowerCase() === ".svg")
    {
        const localPath = path.join(__dirname, '..', 'public', url.parse(req.url).pathname.replace("theme", "themes/" + theme));
        fs.readFile(localPath, function(err, data) {
            if (err) {
                res.sendStatus(404);
            } else {
                var svgString = data.toString('utf8');
                for (key in req.query)
                    svgString = svgString.replaceAll(key, req.query[key]);
                
                res.header('Content-Type', 'image/svg+xml');
                res.send(svgString);
            }
        }); 
    }
    else {
        res.redirect(req.url.replace("theme", "themes/" + theme));
    }
});

module.exports = router;
