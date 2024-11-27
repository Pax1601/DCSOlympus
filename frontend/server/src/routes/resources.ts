import express = require("express");
import fs = require("fs");
const router = express.Router();

module.exports = function (configLocation) {
  router.get("/config", function (req, res, next) {
    if (fs.existsSync(configLocation)) {
      let rawdata = fs.readFileSync(configLocation, "utf-8");
      const config = JSON.parse(rawdata);
      res.send(
        JSON.stringify({
          frontend: { ...config.frontend },
          audio: { ...(config.audio ?? {}) },
          profiles: { ...(config.profiles ?? {}) },
        })
      );
      res.end();
    } else {
      res.sendStatus(404);
    }
  });

  router.put("/profile/:profileName", function (req, res, next) {
    if (fs.existsSync(configLocation)) {
      let rawdata = fs.readFileSync(configLocation, "utf-8");
      const config = JSON.parse(rawdata);
      if (config.profiles === undefined) config.profiles = {};
      config.profiles[req.params.profileName] = req.body;
      fs.writeFileSync(
        configLocation,
        JSON.stringify(config, null, 2),
        "utf-8"
      );
      res.end();
    } else {
      res.sendStatus(404);
    }
  });

  router.put("/profile/reset/:profileName", function (req, res, next) {
    if (fs.existsSync(configLocation)) {
      let rawdata = fs.readFileSync(configLocation, "utf-8");
      const config = JSON.parse(rawdata);
      if (config.profiles[req.params.profileName])
        delete config.profiles[req.params.profileName];
      fs.writeFileSync(
        configLocation,
        JSON.stringify(config, null, 2),
        "utf-8"
      );
      res.end();
    } else {
      res.sendStatus(404);
    }
  });

  router.put("/profile/delete/all", function (req, res, next) {
    if (fs.existsSync(configLocation)) {
      let rawdata = fs.readFileSync(configLocation, "utf-8");
      const config = JSON.parse(rawdata);
      config.profiles = {};
      fs.writeFileSync(
        configLocation,
        JSON.stringify(config, null, 2),
        "utf-8"
      );
      res.end();
    } else {
      res.sendStatus(404);
    }
  });

  return router;
};
