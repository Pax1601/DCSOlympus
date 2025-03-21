/* Requires */
import express = require("express");
import path = require("path");
import logger = require("morgan");
import fs = require("fs");
import bodyParser = require("body-parser");
import cors = require("cors");
import { AudioBackend } from "./audio/audiobackend";
import expressBasicAuth from "express-basic-auth";

/* Load the proxy middleware plugin */
import httpProxyMiddleware = require("http-proxy-middleware");

function checkCustomHeaders(config, usersConfig, groupsConfig, req) {
  let user = req.auth?.user ?? null;
  let group = null;

  /* Check if custom authorization headers are enabled */
  if (
    "customAuthHeaders" in config["frontend"] &&
    config["frontend"]["customAuthHeaders"]["enabled"]
  ) {
    /* If so, check that the custom headers are indeed present */
    if (
      config["frontend"]["customAuthHeaders"]["username"].toLowerCase() in
        req.headers &&
      config["frontend"]["customAuthHeaders"]["group"].toLowerCase() in
        req.headers
    ) {
      /* If they are, assign the group */
      group =
        req.headers[
          config["frontend"]["customAuthHeaders"]["group"].toLowerCase()
        ];

      /* Check that the user is in an existing group */
      if (group in groupsConfig) {
        user =
          req.headers[
            config["frontend"]["customAuthHeaders"]["username"].toLowerCase()
          ];
        usersConfig[user] = { password: null, roles: groupsConfig[group] };
      }
    }
  }

  return user;
}

module.exports = function (configLocation, viteProxy) {
  /* Config specific routers */
  const elevationRouter = require("./routes/api/elevation")(configLocation);
  const resourcesRouter = require("./routes/resources")(configLocation);
  const adminRouter = require("./routes/admin")(configLocation);

  /* Default routers */
  const airbasesRouter = require("./routes/api/airbases");
  const databasesRouter = require("./routes/api/databases")(
    path.join(
      path.dirname(configLocation),
      "..",
      "Mods",
      "Services",
      "Olympus",
      "databases"
    )
  );
  const speechRouter = require("./routes/api/speech")();

  /* Read the users configuration file */
  let usersConfig = {};
  if (
    fs.existsSync(path.join(path.dirname(configLocation), "olympusUsers.json"))
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
    fs.existsSync(path.join(path.dirname(configLocation), "olympusGroups.json"))
  ) {
    let rawdata = fs.readFileSync(
      path.join(path.dirname(configLocation), "olympusGroups.json"),
      { encoding: "utf-8" }
    );
    groupsConfig = JSON.parse(rawdata);
  }

  /* Load the config and create the express app */
  let config = {};
  console.log(`Loading configuration file from ${configLocation}`);
  if (fs.existsSync(configLocation)) {
    let rawdata = fs.readFileSync(configLocation, { encoding: "utf-8" });
    config = JSON.parse(rawdata);
  } else {
    console.error("Error loading configuration file.");
    return undefined;
  }

  /* Load the backend address where DCS is listening */
  const backendAddress = config["backend"]["address"];

  /* Start the express app */
  const app = express();

  /* Define the authentication */
  const defaultUsers = {
    "Game master": config["authentication"]["gameMasterPassword"],
    "Blue commander": config["authentication"]["blueCommanderPassword"],
    "Red commander": config["authentication"]["redCommanderPassword"],
  };
  if (config["authentication"]["adminPassword"]) {
    defaultUsers["Admin"] = config["authentication"]["adminPassword"];
  }
  let users = {};
  Object.keys(usersConfig).forEach(
    (user) => (users[user] = usersConfig[user].password)
  );
  const auth = expressBasicAuth({
    users: { ...defaultUsers, ...users },
  });

  /* Define middleware */
  app.use(
    logger("dev", {
      skip: function (req, res) {
        return res.statusCode < 400;
      },
    })
  );

  /* Authorization middleware */
  if (
    "customAuthHeaders" in config["frontend"] &&
    config["frontend"]["customAuthHeaders"]["enabled"]
  ) {
    /* Custom authorization will be used */
    app.use("/", async (req, res, next) => {
      const user = checkCustomHeaders(config, usersConfig, groupsConfig, req);

      if (user) {
        /* If the user is preauthorized, set the authorization headers to the response */
        res.set(
          config["frontend"]["customAuthHeaders"]["username"],
          req.headers[
            config["frontend"]["customAuthHeaders"]["username"].toLowerCase()
          ]
        );
        res.set(
          config["frontend"]["customAuthHeaders"]["group"],
          req.headers[
            config["frontend"]["customAuthHeaders"]["group"].toLowerCase()
          ]
        );
      }

      next();
    });
  } else {
    /* Simple internal authorization will be used */
    app.use("/olympus", auth);
  }

  /* Define the middleware to replace the authorization header for the olympus backend */
  app.use("/olympus", async (req, res, next) => {
    /* Check if custom authorization headers are being used */
    const user =
      //@ts-ignore
      req.auth?.user ??
      checkCustomHeaders(config, usersConfig, groupsConfig, req);

    /* If either simple authentication or custom authentication has succeded */
    if (user) {
      const userConfig = usersConfig[user];

      /* Check that the user is authorized to at least one role */
      if (userConfig && userConfig.roles.length > 0) {
        /* If a specific command role is requested, proceed with that role */
        if (req.headers["x-command-mode"]) {
          /* Check that the user is authorized to that role */
          if (userConfig.roles.includes(req.headers["x-command-mode"])) {
            /* Check that the role is valid */
            //@ts-ignore
            if (req.headers["x-command-mode"] in defaultUsers) {
              /* Apply the authorization headers */
              req.headers.authorization = `Basic ${btoa(
                //@ts-ignore
                user + ":" + defaultUsers[req.headers["x-command-mode"]]
              )}`;
            } else {
              res.sendStatus(401); // Unauthorized
            }
          } else {
            res.sendStatus(401); // Unauthorized
          }
        } else {
          /* No role has been specified, continue with the highest role */
          /* Check that the role is valid */
          if (userConfig.roles[0] in defaultUsers) {
            /* Apply the authorization headers */
            req.headers.authorization = `Basic ${btoa(
              userConfig.roles[0] + ":" + defaultUsers[userConfig.roles[0]]
            )}`;
          } else {
            res.sendStatus(401); // Unauthorized
          }
        }
      } else {
        if (!(user in defaultUsers)) res.sendStatus(401); // Unauthorized
      }

      /* Send back the roles that the user is enabled to */
      if (userConfig) res.set("X-Enabled-Command-Modes", `${userConfig.roles}`);
      else if (user in defaultUsers)
        res.set("X-Enabled-Command-Modes", `${user}`);
      next();
    } else {
      res.sendStatus(401); // Unauthorized
    }
  });

  /* Proxy middleware */
  if (config["backend"]["port"]) {
    app.use(
      "/olympus",
      httpProxyMiddleware.createProxyMiddleware({
        target: `http://${
          backendAddress === "*" ? "localhost" : backendAddress
        }:${config["backend"]["port"]}/olympus`,
        changeOrigin: true,
      })
    );
  } else {
    app.use(
      "/olympus",
      httpProxyMiddleware.createProxyMiddleware({
        target: `https://${
          backendAddress === "*" ? "localhost" : backendAddress
        }/olympus`,
        changeOrigin: true,
      })
    );
  }

  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use(cors());

  /* Apply routers */
  app.use("/api/airbases", airbasesRouter);
  app.use("/api/elevation", elevationRouter);
  app.use("/api/databases", databasesRouter);
  app.use("/api/speech", speechRouter);
  app.use("/resources", resourcesRouter);

  app.use("/admin", auth);
  app.use("/admin", adminRouter);

  /* Set default index */
  if (viteProxy) {
    app.use(
      "/",
      httpProxyMiddleware.createProxyMiddleware({
        target: `http://localhost:8080/`,
        ws: true,
      })
    );
  } else {
    app.get("/", function (req, res) {
      res.sendFile(path.join(__dirname, "..", "public", "index.html"));
    });
  }

  /* Start the audio backend */
  if (config["audio"]) {
    let audioBackend = new AudioBackend(
      config["audio"]["SRSPort"],
      config["audio"]["WSPort"]
    );
    audioBackend.start();
  }

  return app;
};
