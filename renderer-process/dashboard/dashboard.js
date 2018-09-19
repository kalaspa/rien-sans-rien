const {ipcRenderer} = require('electron')
const {produceHtml, produceHeader} = require('./dashboard-design')

const polarBtn = document.getElementById("polar-button")

polarBtn.addEventListener('click',(event)=>{
    ipcRenderer.send('polar-activate')
})

ipcRenderer.on('track-list-retrieved',(event,tracks)=>{
    var sports = {}

    for (track of tracks){
        if (!sports.hasOwnProperty(track.sport)){
            sports[track.sport] = {
                totalDistance : 0,
                lastYearDistance : 0,
                numberOfSessions : 0,
                time:0
            }
        }
        sports[track.sport].totalDistance += track.totalDistance
        sports[track.sport].numberOfSessions += 1
        sports[track.sport].time += track.duration

    }

    var content = produceHeader()
    for (const [sport, data] of Object.entries(sports)){
        content = content + produceHtml(sport,data)
    }

    document.getElementById("achieve-table").innerHTML = content

})
