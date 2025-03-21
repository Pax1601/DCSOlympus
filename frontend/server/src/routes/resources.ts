import express = require("express");
import fs = require("fs");
import path = require("path");

const router = express.Router();

let sessionHash = "";
let sessionData = {};

module.exports = function (configLocation) {
  router.get("/config", function (req, res, next) {
    let profiles = null;
    if (
      fs.existsSync(
        path.join(path.dirname(configLocation), "olympusProfiles.json")
      )
    ) {
      let rawdata = fs.readFileSync(
        path.join(path.dirname(configLocation), "olympusProfiles.json"),
        "utf-8"
      );
      profiles = JSON.parse(rawdata);
    }
    if (fs.existsSync(configLocation)) {
      /* Read the config file */
      let rawdata = fs.readFileSync(configLocation, "utf-8");
      const config = JSON.parse(rawdata);

      /* Check if the connection is local */
      let local = false;
      if (config.frontend.autoconnectWhenLocal)
        local = req.headers[config.frontend.proxyHeader] === undefined;

      let resConfig = {
        frontend: { ...config.frontend },
        audio: { ...(config.audio ?? {}) },
        controllers: { ...(config.controllers  ?? {}) },
        profiles: { ...(profiles ?? {}) },
        local: local,
      };

      if (local) {
        resConfig["authentication"] = config["authentication"]
      }

      res.send(
        JSON.stringify(resConfig)
      );
      res.end();
    } else {
      res.sendStatus(404);
    }
  });

  router.put("/profile/:profileName", function (req, res, next) {
    /* Create empty profiles file*/
    if (
      !fs.existsSync(
        path.join(path.dirname(configLocation), "olympusProfiles.json")
      )
    ) {
      fs.writeFileSync(
        path.join(path.dirname(configLocation), "olympusProfiles.json"),
        "{}",
        "utf-8"
      );
    }

    /* Check that the previous operation was successfull */
    if (
      fs.existsSync(
        path.join(path.dirname(configLocation), "olympusProfiles.json")
      )
    ) {
      let rawdata = fs.readFileSync(
        path.join(path.dirname(configLocation), "olympusProfiles.json"),
        "utf-8"
      );
      const usersProfiles = JSON.parse(rawdata);
      usersProfiles[req.params.profileName] = req.body;
      fs.writeFileSync(
        path.join(path.dirname(configLocation), "olympusProfiles.json"),
        JSON.stringify(usersProfiles, null, 2),
        "utf-8"
      );
      res.end();
    } else {
      res.sendStatus(404);
    }
  });

  router.put("/profile/reset/:profileName", function (req, res, next) {
    if (
      fs.existsSync(
        path.join(path.dirname(configLocation), "olympusProfiles.json")
      )
    ) {
      let rawdata = fs.readFileSync(
        path.join(path.dirname(configLocation), "olympusProfiles.json"),
        "utf-8"
      );
      const usersProfiles = JSON.parse(rawdata);
      if (req.params.profileName in usersProfiles)
        delete usersProfiles[req.params.profileName];
      fs.writeFileSync(
        path.join(path.dirname(configLocation), "olympusProfiles.json"),
        JSON.stringify(usersProfiles, null, 2),
        "utf-8"
      );
      res.end();
    } else {
      res.sendStatus(404);
    }
  });

  router.put("/profile/delete/all", function (req, res, next) {
    if (
      fs.existsSync(
        path.join(path.dirname(configLocation), "olympusProfiles.json")
      )
    ) {
      fs.writeFileSync(
        path.join(path.dirname(configLocation), "olympusProfiles.json"),
        "{}",
        "utf-8"
      );
      res.end();
    } else {
      res.sendStatus(404);
    }
  });

  router.put("/sessiondata/save/:profileName", function (req, res, next) {
    if (
      req.body.sessionHash === undefined ||
      req.body.sessionData === undefined
    )
      res.sendStatus(400);
    let thisSessionHash = req.body.sessionHash;
    if (thisSessionHash !== sessionHash) {
      sessionHash = thisSessionHash;
      sessionData = {};
    }
    sessionData[req.params.profileName] = req.body.sessionData;
    res.end();
  });

  router.put("/sessiondata/load/:profileName", function (req, res, next) {
    if (req.body.sessionHash === undefined) res.sendStatus(400);
    let thisSessionHash = req.body.sessionHash;
    if (thisSessionHash !== sessionHash) {
      sessionHash = thisSessionHash;
      sessionData = {};
      res.sendStatus(404);
    } else {
      res.send(sessionData[req.params.profileName] ?? {});
      res.end();
    }
  });

  return router;
};
