import express = require('express');
import path = require("path");

const router = express.Router();
const allowedDatabases: Record<string, Record<string, string>> = {
    units: {
        aircraftdatabase: "aircraftdatabase.json",
        groundunitdatabase: "groundunitdatabase.json",
        helicopterdatabase: "helicopterdatabase.json",
        mods: "mods.json",
        navyunitdatabase: "navyunitdatabase.json",
    },
};

module.exports = function (databasesLocation) {
    router.get('/:type/:name', function (req, res) {
        const type = req.params.type;
        const name = req.params.name;
        const allowedType = allowedDatabases[type];

        if (!allowedType) {
            res.status(404).send("Unknown database type");
            return;
        }

        const fileName = allowedType[name];
        if (!fileName) {
            res.status(404).send("Unknown database name");
            return;
        }

        const filePath = path.join(databasesLocation, type, fileName);
        res.sendFile(filePath, function (error) {
            if (error) {
                if (!res.headersSent) {
                    res.status(404).send("Database not found");
                }
            }
        });
    });
    return router;
}
