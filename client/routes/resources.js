const express = require('express');
const router = express.Router();

// TODO should be user selectable or at least configurable from configuration file
var theme = "olympus";

router.get('/theme/*', function (req, res, next) {
    res.redirect(req.url.replace("theme", "themes/" + theme));
});

module.exports = router;
