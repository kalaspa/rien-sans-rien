// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipcRenderer} = require('electron')

const saveBtn = document.getElementById("save-folder")
const selectFolderBtn = document.getElementById('select-folder')

selectFolderBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-folder-dialog')
})

ipcRenderer.on('selected-folder', (event, path) => {
  document.getElementById('selected-folder').innerHTML = `${path}`
})

saveBtn.addEventListener('click',(event) => {
    var folder = document.getElementById('selected-folder').innerHTML

    ipcRenderer.send('save-in-db-folder', folder)

    document.getElementById('selected-folder').innerHTML = ""
})
