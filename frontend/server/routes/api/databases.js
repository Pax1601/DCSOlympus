module.exports = function (databasesLocation) {
    const express = require('express');
    const router = express.Router();
    const fs = require("fs");
    const path = require("path");

    function securePath(base, ...parts) {
        const fullPath = path.resolve(base, ...parts);
        const resolvedBase = path.resolve(base);

        if (!fullPath.startsWith(resolvedBase)) {
            throw new Error("Invalid path");
        }

        return fullPath;
    }

    router.get('/:type/:name', function (req, res) {
        try {
            const filePath = securePath(databasesLocation, req.params.type, req.params.name + ".json");
            const contents = fs.readFileSync(filePath);
            res.status(200).send(contents);
        } catch (error) {
            res.status(404).send('Not found');
        }
    });

    router.put('/save/:type/:name', function (req, res) {
        try {
            const dir = securePath(databasesLocation, req.params.type, "old");
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const filePath = securePath(databasesLocation, req.params.type, req.params.name + ".json");
            const backupPath = securePath(databasesLocation, req.params.type, "old", req.params.name + ".json");

            if (fs.existsSync(filePath)) {
                fs.copyFileSync(filePath, backupPath);
                const json = JSON.stringify(req.body.blueprints, null, "\t");
                fs.writeFileSync(filePath, json, 'utf8');
                res.send("OK");
            } else {
                res.status(404).send('Not found');
            }
        } catch (error) {
            res.status(422).send("Error");
        }
    });

    router.put('/reset/:type/:name', function (req, res) {
        try {
            const defaultPath = securePath(databasesLocation, req.params.type, "default", req.params.name + ".json");
            const targetPath = securePath(databasesLocation, req.params.type, req.params.name + ".json");

            if (fs.existsSync(defaultPath)) {
                fs.copyFileSync(defaultPath, targetPath);
                res.send("OK");
            } else {
                res.status(404).send('Not found');
            }
        } catch (error) {
            res.status(422).send("Error");
        }
    });

    router.put('/restore/:type/:name', function (req, res) {
        try {
            const backupPath = securePath(databasesLocation, req.params.type, "old", req.params.name + ".json");
            const targetPath = securePath(databasesLocation, req.params.type, req.params.name + ".json");

            if (fs.existsSync(backupPath)) {
                fs.copyFileSync(backupPath, targetPath);
                res.send("OK");
            } else {
                res.status(404).send('Not found');
            }
        } catch (error) {
            res.status(422).send("Error");
        }
    });

    return router;
}
