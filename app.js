const electron = require('electron');
const {dialog} = require("electron").remote;
let jQuery = require('jquery');
const hljs = require('highlight.js');
let Quill = require('quill');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const pdf = require('html-pdf');
let gui = require('./gui.js');
let config = {};
const notesFolder = '/notes/';

const app = (process.type === 'renderer') ? electron.remote.app : electron.app;

// Get the file contents
function readFile(filePath){
    try{
        filePath = path.join( app.getPath('userData') + filePath );
        let data = fs.readFileSync(filePath, 'utf8');
        return data;
    } catch(err) {
        throw(err);
    }
}

// Create/save a new file
function saveFile(filePath, content){
    try{
        filePath = path.join( app.getPath('userData') + filePath );
        fs.writeFileSync(filePath, content, 'utf8');
    } catch(err) {
        throw(err);
    }
}

// Delete a file
function deleteFile(filePath){
    try{
        filePath = path.join( app.getPath('userData') + filePath );
        fs.unlinkSync(filePath);
    } catch(err) {
        throw(err);
    }
}

// Make a new directory
function makedir(folderPath){
    try{
        folderPath = path.join( app.getPath('userData') + folderPath );
        fs.mkdirSync(folderPath);
    } catch(err) {
        throw(err);
    }
}

// Check if a path exists
function pathExists(filePath){
    try{
        filePath = path.join( app.getPath('userData') + filePath );
        return fs.existsSync(filePath);
    } catch(err) {
        throw(err);
    }
}

// Add a new note
function addNotebook(title){
    // Generate a random string to append to the file name
    let id = Math.random().toString(36).substr(2, 9);
    let notebookID = (title + "-" + id).toLowerCase().replace(" ", "");
    let filePath = notesFolder + notebookID + '.json';
    let cfg = JSON.parse(readFile('/config.json'));
    cfg.notebooks[notebookID] = { 'title': title, 'path': notebookID+'.json' };

    saveFile('/config.json', JSON.stringify(cfg));
    saveFile(filePath, JSON.stringify([]));

    let defaultContent = {"ops":[{"attributes":{"size":"large","bold":true},"insert":"Untitled"},{"insert":"\n\n\n"}]};
    addNote(notebookID, 'Untitled', defaultContent);
}

// Retrieve a list of the notebooks
function getNotebooks(){
    return JSON.parse(readFile('/config.json')).notebooks;
}

// Delete a notebook and its file
function deleteNotebook(notebookID){
    let cfg = JSON.parse(readFile('/config.json'));
    let file = cfg.notebooks[notebookID].path;
    delete cfg.notebooks[notebookID];

    saveFile('/config.json', JSON.stringify(cfg));
    deleteFile(path.join(notesFolder, file));
}

// Get the file path for a notebook
function getNotebookPath(notebookID){
    let cfg = JSON.parse(readFile('/config.json'));
    return path.join(notesFolder, cfg.notebooks[notebookID].path);
}

// Retrieve a json array of the notes in the notebook
function getNotes(notebookID){
    let cfg = JSON.parse(readFile('/config.json'));
    let notePath = cfg.notebooks[notebookID].path;
    return JSON.parse(readFile( getNotebookPath(notebookID) ));
}

// Add a new note to the notebook
function addNote(notebook, title, content){
    let newNote = {};
    let id = Math.random().toString(36).substr(2, 9);
    newNote.id = id;
    newNote.title = title;
    newNote.created = moment().format('MM-DD-YYYY, HH:mm');
    newNote.favourite = false;
    newNote.content = content;

    let notesFile = getNotes(notebook);
    notesFile.push(newNote);

    saveFile(getNotebookPath(notebook), JSON.stringify(notesFile));
}

// Modify the note content
function editNoteContent(notebook, noteID, content){
    let notes = getNotes(notebook);

    notes.forEach(function(note){
        if(note.id == noteID){
            title = content.ops[0].insert;
            note.title = (title.length > 18) ? title.substr(0, 18) + "..." : title;
            note.content = content;
        }
    });

    saveFile(getNotebookPath(notebook), JSON.stringify(notes));
}

// Delete a note
function deleteNote(notebook, noteID){
    let notes = getNotes(notebook).filter((note) => note.id != noteID);

    saveFile(getNotebookPath(notebook), JSON.stringify(notes));

}

// Get text contents of a note
function getContent(notebook, noteID){
    let notes = getNotes(notebook);
    let noteContent;
    notes.forEach(function(note){
        if(note.id == noteID){
            noteContent = note.content;
        }
    });

    return noteContent;
}

// Calculate how many days ago the note was created
function getNoteTime(date){
    let days = moment().diff(moment(date), 'days');
    if(days==0){
        return 'Today';
    }else if(days==1){
        return 'Yesterday';
    }else{
        return days + " days ago";
    }
}

// Add a note to the favourites
function toggleFavourites(notebook, noteID){
    let notes = getNotes(notebook);

    notes.forEach(function(note){
        if(note.id == noteID){
            note.favourite = !note.favourite;
        }
    });

    saveFile(getNotebookPath(notebook), JSON.stringify(notes));
}

// Get a list of the favourite notes
function getFavourites(){
    let favourites = [];

    let notebooks = getNotebooks();
    for(var id in notebooks){
        let notes = getNotes(id);
        notes.forEach(function(note){
            if(note.favourite){
                favourites.push([id, note]);
            }
        });
    }

    return favourites;
}

// Export note contents into PDF file
function exportPdf(content){
    let savePath = dialog.showSaveDialog({
        filters: [{
            name: 'PDF',
            extensions: ['pdf']
        }]
    });

    if(savePath){
        let css = fs.readFileSync(path.join(__dirname, '/css/quill.snow.css'), 'utf8');
        let html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css}</style></head><body style="margin: 25px 35px">${content}</body></html>`;
        var options = {  };
        pdf.create(html, options).toFile(savePath, function(err, res) {
            console.log(err,res);
        });
    }
}

// Save user settings
function saveSettings(theme, codeTheme){
    let cfg = JSON.parse(readFile('/config.json'));
    cfg.settings.theme = theme;
    cfg.settings.codeTheme = codeTheme;

    saveFile('/config.json', JSON.stringify(cfg));
}

function getSettings(){
    return JSON.parse(readFile('/config.json')).settings;
}

// Create /notes/ folder
if( !pathExists(notesFolder) ){
    makedir(notesFolder);
}

// Load or Initialize the config file
if( !pathExists('/config.json') ){
    config = {
        'notebooks': {},
        'favourites': {},
        'settings': { 'theme': 'light', 'codeTheme': 'monokai'}
    };

    saveFile('/config.json', JSON.stringify(config));

    addNotebook('Getting Started');
    let startContent = fs.readFileSync(path.join(__dirname, '/start.json'), 'utf8');
    addNote(Object.keys(getNotebooks())[0], 'Untitled', JSON.parse(startContent));
}

config = JSON.parse(readFile('/config.json'));


gui.renderGUI();
