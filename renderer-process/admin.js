const {ipcRenderer} = require('electron')

// ipcRenderer.send('polar-oauth')

ipcRenderer.on('polar-oauth-reply',(event,token)=>{
})
