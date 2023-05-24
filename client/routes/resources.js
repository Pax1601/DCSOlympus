const express = require('express');
const router = express.Router();

var theme = "olympus";

router.get('/theme/*', function (req, res, next) {
    res.redirect(req.url.replace("theme", "themes/" + theme));
});

module.exports = router;
