const {ipcMain, BrowserWindow, dialog} = require('electron')

let mainWindow

module.exports = function(win){
    mainWindow = win
}

/* --------------------- ipcMain listeners ---------------------*/


ipcMain.on('open-file-dialog', (event , extension) => {
    const options = {
        title: 'Load the .' + extension + ' file',
        filters: [
            { name: 'All Files', extensions: [extension]}
        ],
        properties: ['openFile']
    }
    console.lgo("There")
    dialog.showOpenDialog(options, (files) => {
        if (files) {
        event.sender.send('selected-directory', extension, files)
        }
    })
})

ipcMain.on('open-folder-dialog', (event , extension) => {
    const options = {
        title: 'Load all files in a folder',
        properties: ['openDirectory']
    }
    dialog.showOpenDialog(options, (folder) => {
        if (folder) {
        event.sender.send('selected-folder', folder)
        }
    })
})

ipcMain.on('open-add-window',(event)=>{
    let win = new BrowserWindow({
        autoHideMenuBar: true,
        modal: true,
        height: 250,
        width: 700,
        resizable: false,
        parent: mainWindow
    })
    win.on('close', () => { win = null })
    win.loadFile("windows/add.html")
    win.show()
})

ipcMain.on('open-folder-window',(event)=>{
    let win = new BrowserWindow({
        autoHideMenuBar: true,
        modal: true,
        height: 250,
        width: 700,
        resizable: false,
        parent: mainWindow
    })

    win.on('close', () => { win = null })
    win.loadFile("windows/folder.html")
    win.show()
})

ipcMain.on('open-settings-window',(event,track)=>{
    let win = new BrowserWindow({
        autoHideMenuBar: true,
        modal: true,
        height: 300,
        width: 700,
        resizable: false,
        parent: mainWindow,
        show: false
    })

    win.on('close', () => { win = null })
    win.loadFile("windows/settings.html")
    win.once('ready-to-show', (event) => {
        event.sender.send("settings-track-id", track)
        win.show()
    })
})
