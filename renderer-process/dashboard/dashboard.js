const {ipcRenderer} = require('electron')

const polarBtn = document.getElementById("polar-button")

polarBtn.addEventListener('click',(event)=>{
    ipcRenderer.send('polar-activate')
})
