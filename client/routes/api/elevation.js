const express = require('express');
const router = express.Router();
const TileSet = require('srtm-elevation').TileSet;

const tileset = new TileSet('./data/');

router.get( "/:lat/:lng", ( req, res ) => {
    tileset.getElevation([req.params.lat, req.params.lng], function(err, elevation) {
        if (err) {
            console.log('getElevation failed: ' + err.message);
        } else {
            res.send(String(elevation));
        }
    });
    
});

module.exports = router;