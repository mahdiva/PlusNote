const {app, BrowserWindow, shell} = require('electron');
const url = require('url');
let win;

if (handleSquirrelEvent(app)) {
    return;
}

function createWindow(){
    win = new BrowserWindow({width: 1300, height: 700, resizable: true, icon: __dirname + '/icon.ico'});
    win.maximize();
    win.setMenu(null);
    win.loadURL(__dirname + '/app.html');
    win.webContents.on('new-window', function(e, url) {
        e.preventDefault();
        shell.openExternal(url);
    });
}

app.on('ready', createWindow);

function handleSquirrelEvent(application) {
    if (process.argv.length === 1){
        return false;
    }

    const ChildProcess = require('child_process');
    const path = require('path');

    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);

    const spawn = function(command, args) {
        let spawnedProcess, error;

        try {
            spawnedProcess = ChildProcess.spawn(command, args, {
                detached: true
            });
        } catch (error) {}

        return spawnedProcess;
    };

    const spawnUpdate = function(args) {
        return spawn(updateDotExe, args);
    };

    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
        case '--squirrel-install':
        case '--squirrel-updated':

            spawnUpdate(['--createShortcut', exeName]);

            setTimeout(application.quit, 1000);
            return true;

        case '--squirrel-uninstall':

            spawnUpdate(['--removeShortcut', exeName]);

            setTimeout(application.quit, 1000);
            return true;

        case '--squirrel-obsolete':

            application.quit();
            return true;
    }
};
