import yargs = require("yargs");
import fs = require("fs");
import http = require("http");

/* Define configuration parameter */
yargs
  .alias("c", "config")
  .describe("c", "olympus.json config location")
  .string("rp");
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
  const app = require("./app")(args["config"]);

  /* Normalize port */
  const port = normalizePort(httpPort);
  app.set("port", port);
  console.log("Express server listening on port: " + port);

  /* Create HTTP server */
  const server = http.createServer(app);

  /* Listen on provided port, on all network interfaces. */
  server.listen(port);
  server.on("error", (error) => onError(error, port));
  server.on("listening", () => onListening(server.address()));

  /* Optional https support */
  let https = null;
  let credentials = null;
  let httpsServer = null;
  if (json["frontend"]["https"] === true) {
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
    credentials = { key: privateKey, cert: certificate };
    httpsServer = https.createServer(credentials, app);
    httpsServer.listen(httpsPort);
    console.log("Express server listening on SSL port: " + httpsPort);
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
