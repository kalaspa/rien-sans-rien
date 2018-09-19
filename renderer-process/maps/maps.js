const GoogleMapsLoader = require('google-maps'); // only for common js environments
const {ipcRenderer} = require('electron')
const {produceHtml} = require('./maps-design')
const {googleApiKey} = require('./../../config')

let map
var boundList = {}

const reloadBtn = document.getElementById("reload-button-map")

reloadBtn.addEventListener('click', (event) => {
    console.log("test")
    ipcRenderer.send('get-track-list')
})

var updateBounds = function(){
    var bounds = new google.maps.LatLngBounds();

    Array.prototype.forEach.call(document.querySelectorAll(".map-switch"),(sw)=>{
        var trackId = sw.dataset.id
        if (sw.checked){
            bounds.union(boundList[trackId])
        }
    })
    map.fitBounds(bounds);
}

GoogleMapsLoader.KEY = googleApiKey;

GoogleMapsLoader.load(function(google) {
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 45, lng: 5},
      zoom: 8,
      fullscreenControl: false,
      fullscreenControlOptions: false,
      streetViewControl: false,
      mapTypeId: 'terrain'
    });
    map.data.setStyle({
        strokeColor: '#9f2b32'
    })
});

ipcRenderer.on('track-list-retrieved',(event,tracks)=>{
    checks = ""
    for (track of tracks){
        if (track.gpsOn){
            checks = checks + produceHtml(track)
        }
    }
    document.getElementById("check-tracks").innerHTML = checks

    Array.prototype.forEach.call(document.querySelectorAll(".map-switch"),(sw)=>{

        sw.addEventListener('click',(event)=>{
            var trackId = sw.dataset.id

            if (sw.checked){
                ipcRenderer.send('get-track-points','maps',trackId)
            }
            else {
                var dataFeature = map.data.getFeatureById(trackId)
                if (dataFeature){
                    map.data.remove(dataFeature)
                    updateBounds()
                }
            }
        })
    })
})

ipcRenderer.on('track-points-retrieved-maps',(event,trackPoints)=>{
    var data = []
    var bounds = new google.maps.LatLngBounds()
    var trackId = trackPoints[0].trackId

    for (trackPoint of trackPoints){
        var latLng = {
            lat: trackPoint.lattitude,
            lng: trackPoint.longitude
        }
        if (trackPoint.lattitude){
            data.push(latLng)
            bounds.extend(latLng)
        }
    }

    boundList[trackId] = bounds
    var geometry = new google.maps.Data.LineString(data)
    var dataFeature = new google.maps.Data.Feature({
        geometry: geometry,
        id: trackPoints[0].trackId
    })
    map.data.add(dataFeature)
    updateBounds()
})
