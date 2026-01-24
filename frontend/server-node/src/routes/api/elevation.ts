import express = require('express');
import fs = require('fs');
import srtmElevation = require('srtm-elevation');

const TileSet = srtmElevation.TileSet;
const SRTMElevationDownloader = srtmElevation.SRTMElevationDownloader;
const router = express.Router();

module.exports = function (configLocation) {
    let rawdata = fs.readFileSync(configLocation, "utf-8");
    let config = JSON.parse(rawdata);
    var tileset = null;

    if (config["frontend"] === undefined || config["frontend"]["elevationProvider"] === undefined)
        tileset = new TileSet('./hgt');
    else
        tileset = new TileSet('./hgt', {downloader: new SRTMElevationDownloader('./hgt', config["frontend"]["elevationProvider"])});

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

    return router; 
}