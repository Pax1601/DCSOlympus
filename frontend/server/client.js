const { app, BrowserWindow } = require("electron/main");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const yargs = require("yargs");

yargs
  .alias("c", "config")
  .describe("c", "olympus.json config location")
  .string("rp");

yargs.alias("s", "server").describe("s", "run in server mode").string("rp");
args = yargs.argv;

console.log(`Config location: ${args["config"]}`);
var frontendPort = 3000;
var serverMode = args["server"] ?? false;
if (fs.existsSync(args["config"])) {
  var json = JSON.parse(fs.readFileSync(args["config"], "utf-8"));
  frontendPort = json["frontend"]["port"];
} else {
  console.log("Failed to read config, trying default port");
}

function createWindow() {
  const win = new BrowserWindow({
    icon: "./../img/olympus.ico",
  });

  win.loadURL(
    `http://localhost:${frontendPort}${serverMode ? "/?server" : ""}`
  );
  win.setMenuBarVisibility(false);

  if (serverMode) {
  } else {
    win.maximize();
  }
}

app
  .whenReady()
  .then(() => {
    const server = spawn("node", [
      path.join(".", "build", "www.js"),
      "--config",
      args["config"],
      "--vite",
    ]);

    server.stdout.on("data", (data) => {
      console.log(`${data}`);
    });

    server.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    server.on("close", (code) => {
      console.log(`Child process exited with code ${code}`);
    });

    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  })
  .catch((err) => {
    console.error(err);
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
