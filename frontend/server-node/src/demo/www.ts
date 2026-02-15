import yargs = require("yargs");
import fs = require("fs");
import http = require("http");

/* Define configuration parameter */
yargs
  .alias("c", "config")
  .describe("c", "olympus.json config location")
  .string("rp");
const args = yargs.argv;

console.log("Please wait while DCS Olympus DEMO Backend Server starts up...");
console.log(`Config location: ${args["config"]}`);

let rawdata = fs.readFileSync(args["config"], "utf-8");
let config = JSON.parse(rawdata);

/**
 * Module dependencies.
 */

var app = require("./demo")(args["config"]);

/**
 * Get port from environment and store in Express.
 */

var configPort = null;
if (config["backend"] != undefined && config["backend"]["port"] != undefined) {
  configPort = config["backend"]["port"];
}

var port = normalizePort(configPort || "3001");
app.set("port", port);
console.log("Express server listening on port: " + port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
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

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  console.log("Listening on " + bind);
}

console.log(
  "DCS Olympus DEMO Backend Server {{OLYMPUS_VERSION_NUMBER}}.{{OLYMPUS_COMMIT_HASH}} started correctly!"
);
console.log("Waiting for connections...");

process.title = `DCS Olympus DEMO Backend Server {{OLYMPUS_VERSION_NUMBER}} (${port})`;
