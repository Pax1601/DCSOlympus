import express = require("express");
import fs = require("fs");
import path = require("path");

const router = express.Router();

module.exports = function (configLocation) {
  router.get("/config", function (req, res, next) {
    if (req.auth?.user === "Admin") {
      /* Read the users configuration file */
      let usersConfig = {};
      if (
        fs.existsSync(
          path.join(path.dirname(configLocation), "olympusUsers.json")
        )
      ) {
        let rawdata = fs.readFileSync(
          path.join(path.dirname(configLocation), "olympusUsers.json"),
          { encoding: "utf-8" }
        );
        usersConfig = JSON.parse(rawdata);
      }

      /* Read the groups configuration file */
      let groupsConfig = {};
      if (
        fs.existsSync(
          path.join(path.dirname(configLocation), "olympusGroups.json")
        )
      ) {
        let rawdata = fs.readFileSync(
          path.join(path.dirname(configLocation), "olympusGroups.json"),
          { encoding: "utf-8" }
        );
        groupsConfig = JSON.parse(rawdata);
      }

      res.send({ users: usersConfig, groups: groupsConfig });
      res.end();
    } else {
      res.sendStatus(401);
    }
  });

  router.put("/config", function (req, res, next) {
    if (req.auth?.user === "Admin") {
      /* Create a backup folder for the configuration files */
      let backupFolder = path.join(
        path.dirname(configLocation),
        "Olympus Configs Backup"
      );
      if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder);
      }

      /* Make a backup of the existing files */
      let timestamp = new Date().toISOString().replace(/:/g, "-");
      if (
        fs.existsSync(
          path.join(path.dirname(configLocation), "olympusUsers.json")
        )
      ) {
        fs.copyFileSync(
          path.join(path.dirname(configLocation), "olympusUsers.json"),
          path.join(
            path.dirname(configLocation),
            "Olympus Configs Backup",
            "olympusUsers.json." + timestamp
          )
        );
      }
      if (
        fs.existsSync(
          path.join(path.dirname(configLocation), "olympusGroups.json")
        )
      ) {
        fs.copyFileSync(
          path.join(path.dirname(configLocation), "olympusGroups.json"),
          path.join(
            path.dirname(configLocation),
            "Olympus Configs Backup",
            "olympusGroups.json." + timestamp
          )
        );
      }

      /* Save the users configuration file */
      let usersConfig = req.body.users;

      if (usersConfig) {
        fs.writeFileSync(
          path.join(path.dirname(configLocation), "olympusUsers.json"),
          JSON.stringify(usersConfig, null, 2)
        );
      }

      /* Save the groups configuration file */
      let groupsConfig = req.body.groups;

      if (groupsConfig) {
        fs.writeFileSync(
          path.join(path.dirname(configLocation), "olympusGroups.json"),
          JSON.stringify(groupsConfig, null, 2)
        );
      }

      res.send({ users: usersConfig, groups: groupsConfig });
      res.end();
    } else {
      res.sendStatus(401);
    }
  });

  return router;
};
