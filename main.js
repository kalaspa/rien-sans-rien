// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
const db = require("./scripts/database")
const {ipcMain} = require('electron')
const polar = require('./scripts/polar')


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let trackPointList = {}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
      autoHideMenuBar: true,
      width:1920,
      height:1080
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    createWindow()
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})


ipcMain.on('open-file-dialog', (event , extension) => {
  const {dialog} = require('electron')
  const options = {
      title: 'Load the .' + extension + ' file',
      filters: [
          { name: 'All Files', extensions: [extension]}
      ],
      properties: ['openFile']
  }
  dialog.showOpenDialog(
      options, (files) => {
    if (files) {
      event.sender.send('selected-directory', extension, files)
    }
  })
})

ipcMain.on('open-folder-dialog', (event , extension) => {
  const {dialog} = require('electron')
  const options = {
      title: 'Load all files in a folder',
      properties: ['openDirectory']
  }
  dialog.showOpenDialog(
      options, (folder) => {
    if (folder) {
      event.sender.send('selected-folder', folder)
    }
  })
})

ipcMain.on('save-in-db',(event, gpxFile, csvFile)=>{
    if (csvFile){
        db.addTrack(gpxFile, csvFile)
            .then(()=>{
                event.sender.send('success-save')
            })
            .catch((err)=>{
                event.sender.send('error-save',err)
            })
    }
})

ipcMain.on('save-in-db-folder',(event, folder)=>{
    if (folder){
        db.addFolder(folder)
            .then(()=>{
                event.sender.send('success-save')
            })
            .catch((err)=>{
                event.sender.send('error-save',err)
            })
    }
})

ipcMain.on('get-track-list',(event)=>{
    db.getTrackList().then((trackInstances)=>{
        tracks = []
        for (trackInstance of trackInstances){
            tracks.push(trackInstance.get({plain:true}))
        }
        tracks.sort((a,b)=>{return new Date(b.date).getTime() - new Date(a.date).getTime()})
        event.sender.send('track-list-retrieved',tracks)
    })
})

ipcMain.on('get-track-points',(event,process,trackId)=>{
    if (trackPointList.hasOwnProperty(trackId)){
        event.sender.send('track-points-retrieved-'+process,trackPointList[trackId])
    }
    else {
        db.getTrackPoints(trackId)
            .then((trackPointInstances)=>{

                trackPoints = []
                var duration
                for (trackPointInstance of trackPointInstances){
                    trackPoints.push(trackPointInstance.get({plain:true}))
                }
                trackPoints.sort((a,b)=>{return a.time - b.time})

                event.sender.send('track-points-retrieved-'+process,trackPoints)
                trackPointList[trackId] = trackPoints
            })
    }
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

ipcMain.on('polar-oauth',(event)=>{
    polar.auth()
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
