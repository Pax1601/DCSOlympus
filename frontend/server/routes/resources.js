const express = require('express');
const router = express.Router();

router.get('/theme/*', function (req, res, next) {
    var reqTheme = "olympus";
    
    /* Yes, this in an easter egg! :D Feel free to ignore it, or activate the parrot theme to check what it does. Why parrots? The story is a bit long, come to the Discord and ask :D */
    if (reqTheme === "parrot" && !req.url.includes(".css"))
        res.redirect('/themes/parrot/images/parrot.svg');
    else
        res.redirect(req.url.replace("theme", "themes/" + reqTheme));
});

router.put('/theme/:newTheme', function (req, res, next) {
    res.end("Ok");
});

module.exports = router;
