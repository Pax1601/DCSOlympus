const electronApp = require('electron').app;
const electronBrowserWindow = require('electron').BrowserWindow;
const electronIpcMain = require('electron').ipcMain;
const path = require('path');

let window;

/* Add the System32 folder to the environment for the shortcuts creation to work properly */
process.env['PATH'] = process.env['PATH'] + "%WINDIR%\\System32;"

function createWindow() {
    const window = new electronBrowserWindow({
		width: 1200,
		height: 750,
		frame: false,
        resizable: true,
        maximizable: true,
		webPreferences: {
			contextIsolation: true,
			preload: path.join(__dirname, "javascripts", 'preload.js'),
			nodeIntegration: true, 
		},
		icon: "./../img/olympus_configurator.ico"
    });

    window.loadFile('index.html').then(() => { window.show(); });

	window.on("maximize", () => {
		window.webContents.send('event:maximized')
	})

	window.on("unmaximize", () => {
		window.webContents.send('event:unmaximized')
	})

    return window;
}

electronApp.on('ready', () => {
    window = createWindow();
});

electronApp.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electronApp.quit();
    }
});

electronApp.on('activate', () => {
    if (electronBrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

electronIpcMain.on('window:minimize', () => {
    window.minimize();
})

electronIpcMain.on('window:maximize', () => {
    window.maximize();
})

electronIpcMain.on('window:restore', () => {
    window.restore();
})

electronIpcMain.on('window:close', () => {
    window.close();
})
