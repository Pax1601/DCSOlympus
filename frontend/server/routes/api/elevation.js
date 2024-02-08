const express = require('express');
var fs = require('fs');
const router = express.Router();
const TileSet = require('srtm-elevation').TileSet;
const SRTMElevationDownloader = require('srtm-elevation').SRTMElevationDownloader;

let rawdata = fs.readFileSync('../../olympus.json');
let config = JSON.parse(rawdata);
var tileset = null;

if (config["client"] === undefined || config["client"]["elevationProvider"] === undefined)
    tileset = new TileSet('./hgt');
else
    tileset = new TileSet('./hgt', {downloader: new SRTMElevationDownloader('./hgt', config["client"]["elevationProvider"])});

router.get( "/:lat/:lng", ( req, res ) => {
    tileset.getElevation([req.params.lat, req.params.lng], function(err, elevation) {
        if (err) {
            console.log('getElevation failed: ' + err.message);
            res.send("n/a");
        } else {
            res.send(String(elevation));
        }
    });
    
});

module.exports = router;