'use strict';
const electron = require('electron');
const app = electron.app;

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// prevent window being garbage collected
//noinspection JSAnnotator
let mainWindow;

function onClosed() {
    // dereference the window
    // for multiple windows store them in an array
    mainWindow = null;
}

// Actually creates the window
function createMainWindow() {
    const win = new electron.BrowserWindow({
        width: 900,
        height: 900
    });

    //noinspection JSAnnotator
    win.loadURL(`file://${__dirname}/index.html`);
    win.on('closed', onClosed);

    return win;
}

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin')
        app.quit();
});

app.on('activate', function() {
    if (!mainWindow)
        mainWindow = createMainWindow();
});

app.on('ready', function() {
    mainWindow = createMainWindow();
});
