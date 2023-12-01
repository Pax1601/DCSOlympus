const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

var themesMap = {};

var theme = "olympus";
router.get('/theme/*', function (req, res, next) {
    if (!req.cookies.id) {
        const id = uuidv4();
        res.cookie('id', id, { httpOnly: true });
        themesMap[id] = "olympus";
        reqTheme = "olympus";
    }
    else {
        if (!(req.cookies.id in themesMap)) {
            themesMap[req.cookies.id] = "olympus";
        }
        reqTheme = themesMap[req.cookies.id];
    }
    
    /* Yes, this in an easter egg! :D Feel free to ignore it, or activate the parrot theme to check what it does */
    if (reqTheme === "parrot" && !req.url.includes(".css"))
        res.redirect('/themes/parrot/images/parrot.svg');
    else
        res.redirect(req.url.replace("theme", "themes/" + reqTheme));
});

router.put('/theme/:newTheme', function (req, res, next) {
    const newTheme = req.params.newTheme;
    if (req.cookies.id) {
        themesMap[req.cookies.id] = newTheme;
        console.log("Theme set to " + newTheme + " for session " + req.cookies.id);
    } else {  
        console.log("Failed to set theme to " + newTheme + ", no session id");
    }

    res.end("Ok");
});

module.exports = router;
