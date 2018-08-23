const {ipcRenderer} = require('electron')
const {produceHtml, produceHeader} = require('./admin-design')

ipcRenderer.on('track-list-retrieved',(event,tracks)=>{
    line = produceHeader()
    for (track of tracks){
        line = line + produceHtml(track)
    }
    document.getElementById("admin-table").innerHTML = line

    Array.prototype.forEach.call(document.querySelectorAll(".settings-btn"),(settingsBtn)=>{
        settingsBtn.addEventListener('click',(event)=>{
            var trackId = settingsBtn.dataset.id
            ipcRenderer.send('open-settings-window',trackId)
        })
    })

})


// ipcRenderer.send('polar-oauth')

ipcRenderer.on('polar-oauth-reply',(event,token)=>{
})
