import yargs = require("yargs");
import fs = require("fs");
import http = require("http");

/* Define configuration parameters */
yargs
  .alias("c", "config")
  .describe("c", "olympus.json config location")
  .string("c");
yargs
  .alias("v", "vite")
  .describe("v", "proxy requests to vite server for development")
  .boolean("v");
const args = yargs.argv;

/* Startup print */
console.log("Please wait while DCS Olympus Server starts up...");
console.log(`Config location: ${args["config"]}`);

/* Load the configuration file */
let httpPort = 0;
if (fs.existsSync(args["config"])) {
  const json = JSON.parse(fs.readFileSync(args["config"], "utf-8"));
  httpPort = json["frontend"]["port"];

  /* Load the dependencies. The app is loaded providing the configuration file location */
  const app = require("./app")(args["config"], args["vite"]);

  /* Normalize port */
  const port = normalizePort(httpPort);
  app.set("port", port);
  const httpsEnabled = json["frontend"]["https"] === true;

  /* Optional https support */
  let https = null;
  if (httpsEnabled) {
    https = require("https");
    const privateKey = fs.readFileSync(
      json["frontend"]["keyPath"] ?? "./cert/default.key",
      "utf8"
    );
    const certificate = fs.readFileSync(
      json["frontend"]["certPath"] ?? "./cert/default.crt",
      "utf8"
    );
    const httpsPort = json["frontend"]["httpsPort"] ?? 3433;
    const credentials = { key: privateKey, cert: certificate };
    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(httpsPort);
    httpsServer.on("error", (error) => onError(error, httpsPort));
    httpsServer.on("listening", () => onListening(httpsServer.address()));
    console.log("Express server listening on HTTPS port: " + httpsPort);
  } else {
    console.log("Express server listening on HTTP port: " + port);

    /* Create HTTP server */
    const server = http.createServer(app);

    /* Listen on provided port, on all network interfaces. */
    server.listen(port);
    server.on("error", (error) => onError(error, port));
    server.on("listening", () => onListening(server.address()));
  }

  /* Final user friendly printing */
  console.log(
    "DCS Olympus server {{OLYMPUS_VERSION_NUMBER}}.{{OLYMPUS_COMMIT_HASH}} started correctly!"
  );
  console.log("Waiting for connections...");
  process.title = `DCS Olympus server {{OLYMPUS_VERSION_NUMBER}} (${port})`;
} else {
  console.log("Failed to read config, aborting!");
}

/* Normalize a port into a number, string, or false. */
function normalizePort(val) {
  let port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

/* Event listener for HTTP server "error" event. */
function onError(error, port: number) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  /* Handle specific listen errors with friendly messages */
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/* Event listener for HTTP server "listening" event. */
function onListening(address) {
  const bind =
    typeof address === "string" ? "pipe " + address : "port " + address.port;
  console.log("Listening on " + bind);
}
