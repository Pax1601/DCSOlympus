import express = require('express');
import fs = require('fs');
var gtts = require('node-gtts')('en');

const router = express.Router();

module.exports = function () {
    router.put( "/generate", ( req, res, next ) => {        
        res.set({'Content-Type': 'audio/mpeg'});
        gtts.stream(req.body.text).pipe(res);
    });

    return router; 
}