const {ipcRenderer} = require('electron')
const Promise = require('promise')
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

ipcRenderer.send('get-track-list')

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
            const parent = btn.parentElement
            var wasOpen = parent.classList.contains('is-open')

            Array.prototype.forEach.call(document.querySelectorAll(".demo-wrapper.is-open"),(wrp)=>{
                wrp.classList.remove('is-open')
            })

            trackId = btn.dataset.id

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

function makeFilterFunc(howMany) {
    return function filterFunc(elt, idx, arr) {
        return idx === 0         ||       // first element
        idx === arr.length-1     ||       // last element
        arr.length < howMany     ||
        idx % Math.floor(arr.length / howMany) === 0;
    };
}

ipcRenderer.on('track-points-retrieved-tracks',(event,trackPoints)=>{
    filterFunc = makeFilterFunc(800);
    currentTrackPoints = trackPoints.filter(filterFunc)
    setGraphs()
})
