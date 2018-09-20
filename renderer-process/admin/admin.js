const {ipcRenderer} = require('electron')
const {produceHtml, produceHeader} = require('./admin-design')

const deleteBtn = document.getElementById('delete-button')

deleteBtn.addEventListener('click',(event)=>{
    var selected = []
    Array.prototype.forEach.call(document.querySelectorAll(".admin-line"),(radio)=>{
        if (radio.checked){
            selected.push(radio.dataset.id)
        }
    })
    ipcRenderer.send('delete-tracks',selected)
})

ipcRenderer.on('success-delete',(event)=>{
    ipcRenderer.send('get-track-list')
    alert("Successfully deleted in the database")
})

ipcRenderer.on('error-delete',(event,err)=>{
    console.log(err)
    alert("Error : " + err)
})


ipcRenderer.on('track-list-retrieved',(event,tracks)=>{
    var line = produceHeader()
    for (track of tracks){
        line = line + produceHtml(track)
    }
    document.getElementById("admin-table").innerHTML = line

    Array.prototype.forEach.call(document.querySelectorAll(".settings-btn"),(settingsBtn)=>{
        settingsBtn.addEventListener('click',(event)=>{
            var trackId = settingsBtn.dataset.id
            var track = tracks.find(elt=> elt.id==trackId)
            ipcRenderer.send('open-settings-window',track)
        })
    })

})
