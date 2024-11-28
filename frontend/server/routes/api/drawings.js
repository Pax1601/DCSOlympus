"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const fs = require("fs");
const app = express();
function sendNoDrawings(res) {
    res
        .status(400)
        .send("This mission has no drawings");
}
/**************************************************************************************************************/
//  Endpoints
/**************************************************************************************************************/
app.get("/", (req, res) => {
    //TODO: send all drawings
});

app.get("/:layerName/:drawingName", (req, res) => {
    // TODO: get all drawings in some way

    if (!drawings) {
        sendNoDrawings(res);
        return;
    }

    const layerName = req.params.layerName;
    const drawingName = req.params.drawingName;

    if (!drawings.hasOwnProperty(layerName)) {
        res
            .status(404)
            .send(`Unknown layer name "${layerName}".  Available options are:\n\t` +
            Object.keys(drawings).join("\n\t"));
    }

    if (!drawings[layerName].hasOwnProperty(drawingName)) {
        res
            .status(404)
            .send(`Unknown drawings name "${drawingName}".  Available options are:\n\t` +
            Object.keys(drawings[layerName]).join("\n\t"));
    }
    else {
        res.status(200).json(drawings[layerName][drawingName]);
    }
});
module.exports = app;
