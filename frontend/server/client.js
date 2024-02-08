const { app, BrowserWindow } = require('electron/main')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process');
const yargs = require('yargs');

yargs.alias('c', 'config').describe('c', 'olympus.json config location').string('rp');
args = yargs.argv;

console.log(`Config location: ${args["config"]}`)
var frontendPort = 3000;
if (fs.existsSync(args["config"])) {
	var json = JSON.parse(fs.readFileSync(args["config"], 'utf-8'));
	frontendPort = json["frontend"]["port"];
} else {
	console.log("Failed to read config, trying default port");
}

function createWindow() {
	const win = new BrowserWindow({
		icon: "./../img/olympus.ico"
	})

	win.loadURL(`http://localhost:${frontendPort}`);
	win.setMenuBarVisibility(false);
	win.maximize();
}

app.whenReady().then(() => {
	const server = spawn('node', [path.join('.', 'bin', 'www'), "--config", args["config"]]);

	server.stdout.on('data', (data) => {
		console.log(`${data}`);
	});

	server.stderr.on('data', (data) => {
		console.error(`stderr: ${data}`);
	});

	server.on('close', (code) => {
		console.log(`Child process exited with code ${code}`);
	}); 

	createWindow()

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow()
		}
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})