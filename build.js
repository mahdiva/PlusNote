var electronInstaller = require('electron-winstaller');

var settings = {
    appDirectory: './PlusNote-win32-x64',
    outputDirectory: './installer',
    authors: 'Mahdi Varposhti',
    exe: './PlusNote.exe',
	setupIcon: './icon.ico'
};

resultPromise = electronInstaller.createWindowsInstaller(settings);

resultPromise.then(() => {
    console.log("Success!");
}, (e) => {
    console.log(`Error: ${e.message}`);
});
