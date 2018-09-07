// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipcRenderer} = require('electron')

const saveBtn = document.getElementById("save")
const selectGPXBtn = document.getElementById('select-gpx')
const selectCSVBtn = document.getElementById('select-csv')

selectGPXBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog','gpx')
})

selectCSVBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog','csv')
})

ipcRenderer.on('selected-directory', (event, extension, path) => {
  document.getElementById('selected-' + extension).innerHTML = `${path}`
})

ipcRenderer.on('success-save',(event)=>{
    console.log('success')
    alert("Successfully added in the database")
})

ipcRenderer.on('error-save',(event,err)=>{
    console.log(err)
    alert("Error : " + err)
})

saveBtn.addEventListener('click',(event) => {
    var gpxFile = document.getElementById('selected-gpx').innerHTML
    var csvFile = document.getElementById('selected-csv').innerHTML

    ipcRenderer.send('save-in-db', gpxFile, csvFile)

    document.getElementById('selected-gpx').innerHTML = ""
    document.getElementById('selected-csv').innerHTML = ""
})
