const { app, BrowserWindow } = require('electron/main')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process');

const jsonPath = ("..", "olympus.json");
var clientPort = 3000;

if (fs.existsSync(jsonPath)) {
	var json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
	clientPort = json["client"]["port"];
}

function createWindow() {
	const win = new BrowserWindow({
		icon: "./../img/olympus.ico"
	})

	win.loadURL(`http://localhost:${clientPort}`);
	win.setMenuBarVisibility(false);
	win.maximize();
}

app.whenReady().then(() => {
	const server = spawn('node', [path.join('.', 'bin', 'www')]);

	server.stdout.on('data', (data) => {
		console.log(`stdout: ${data}`);
	});

	server.stderr.on('data', (data) => {
		console.error(`stderr: ${data}`);
	});

	server.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
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