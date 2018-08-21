const {ipcRenderer} = require('electron')
const Promise = require('promise')
const {BrowserWindow} = require('electron').remote
const {produceHtml} = require('./tracks-design')
const td = require('./tracks-drawing')

const reloadBtn = document.getElementById("reload-button")
const addTrackButton = document.getElementById("add-track-button")
const addFolderButton = document.getElementById("add-folder-button")

const speedSwitch = document.getElementById("speed")
const altitudeSwitch = document.getElementById("altitude")
const hrSwitch = document.getElementById("hr")
const distancesSwitch = document.getElementById("distances")

var trackId = false
var currentTrackPoints = false

reloadBtn.addEventListener('click', (event) => {
  ipcRenderer.send('get-track-list')
  td.clear()
})

addTrackButton.addEventListener('click', (event) => {
    ipcRenderer.send('open-add-window')
})

addFolderButton.addEventListener('click', (event) => {
    ipcRenderer.send('open-folder-window')
})

ipcRenderer.send('get-track-list','tracks')

Array.prototype.forEach.call(document.querySelectorAll(".switchs"),(sw)=>{
    sw.addEventListener('click',(event)=>{
        if (trackId){
            if (event.target.checked){
                td.take(currentTrackPoints,event.target.id)
            }
            else {
                td.hide(event.target.id)
            }
            if (!altitudeSwitch.checked && !speedSwitch.checked && !distancesSwitch.checked && !hrSwitch.checked){
                td.clear()
            }
        }
    })
})

var addDemoListeners = function(){
    const demoBtns = document.querySelectorAll('.demo-toggle-button')

    // Listen for demo button clicks
    Array.prototype.forEach.call(demoBtns, (btn) => {
      btn.addEventListener('click', (event) => {
        const parent = event.target.parentElement
        var wasOpen = parent.classList.contains('is-open')

        Array.prototype.forEach.call(document.querySelectorAll(".demo-wrapper"),(wrp)=>{
            wrp.classList.remove('is-open')
        })

        trackId = event.target.dataset.id

        if (!wasOpen){
            parent.classList.add('is-open')
            ipcRenderer.send('get-track-points',"tracks",trackId)
        }
        else {
            trackId = false
            currentTrackPoints = false
            td.clear()
        }
      })
    })
}

var setGraphs = function(){

    td.parseTime(currentTrackPoints)

    if (altitudeSwitch.checked)
        {td.take(currentTrackPoints,"altitude")}
    if (speedSwitch.checked)
        {td.take(currentTrackPoints,"speed")}
    if (distancesSwitch.checked)
        {td.take(currentTrackPoints,"distances")}
    if (hrSwitch.checked)
        {td.take(currentTrackPoints,"hr")}
}

ipcRenderer.on('track-list-retrieved',(event,tracks)=>{
    demos = ""
    for (track of tracks){
        demos = demos + produceHtml(track)
    }
    document.getElementById("demo-tracks").innerHTML = demos

    addDemoListeners()
})

ipcRenderer.on('track-points-retrieved-tracks',(event,trackPoints)=>{
    currentTrackPoints = trackPoints
    setGraphs()
})
