const { app, BrowserWindow } = require('electron/main')
const path = require('path')

function createWindow() {
	const win = new BrowserWindow({
		width: 1310,
		height: 800,
		webPreferences: {
			preload: path.join(__dirname, "javascripts", 'preload.js'),
			nodeIntegration: true, // like here
		},
		icon: "./../img/olympus.ico"
	})

	win.loadFile('index.html');
	win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
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