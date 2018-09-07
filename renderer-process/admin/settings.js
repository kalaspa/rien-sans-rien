// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipcRenderer} = require('electron')

const saveBtn = document.getElementById("update-name")

let trackId = false

ipcRenderer.on('settings-track-id',(event,id)=>{
    trackId = id
})

saveBtn.addEventListener('click',(event) => {
    var new_name = document.getElementById('new-name').value

    ipcRenderer.send('update-name-in-db', trackId, new_name)

    document.getElementById('new-name').value = ""
})

ipcRenderer.on('success-update',(event)=>{
    ipcRenderer.send('get-track-list')
    alert("Successfully updated in the database")
})

ipcRenderer.on('error-update',(event,err)=>{
    console.log(err)
    alert("Error : " + err)
})
