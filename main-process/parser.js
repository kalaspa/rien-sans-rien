const Papa = require('papaparse')
const moment = require('moment')
const {googleApiKey} = require('./../config')
const d3 = require('d3')
const Promise = require('promise')
const fs = require('fs');

const threshold = 5

const googleMaps = require('@google/maps').createClient({
    key : googleApiKey,
    Promise: Promise,
    rate: {limit: 50},
});

var parseNullString = function(inputString){
    return "null".toUpperCase() == inputString.toUpperCase() ? null : inputString
}

var ascentDescent = function(altitudeSample){
    var ascent = 0
    var descent = 0

    var previousAlt = altitudeSample[0]

    for (alt of altitudeSample){
        var diff = alt - previousAlt
        if (Math.abs(diff) > threshold && alt!=0){
            if (diff > 0){ascent += diff}
            else { descent += -diff}
            previousAlt = alt
        }
    }

    return [ascent,descent]
}

var ParseString = require('xml2js').parseString;

exports.feedCSV = function(track, trackPoints, csvFile){
    var parseTime = d3.timeParse("%d/%m/%Y,%H:%M:%S")

    return new Promise((resolve, reject)=>{
        fs.readFile(csvFile, function (err, data) {
            if (err) {reject(err)}

            csvData = Papa.parse(data.toString(),{dynamicTyping: true}).data

            track.name = parseNullString(csvData[1][0])
            track.sport = parseNullString(csvData[1][1])
            track.date = parseTime(csvData[1][2]+','+csvData[1][3])
            track.duration = new Date('1970-01-01T' + csvData[1][4] + 'Z').getTime() / 1000
            track.totalDistance = csvData[1][5]
            track.averageHeartRate = csvData[1][6]
            track.averageSpeed = csvData[1][7]
            track.maxSpeed = csvData[1][8]
            track.averagePace = new Date('1970-01-01T' + csvData[1][9] + 'Z').getTime() / 1000
            track.maxPace = new Date('1970-01-01T' + csvData[1][10] + 'Z').getTime() / 1000
            track.calories = csvData[1][11]
            track.fatPercentageOfCalories = csvData[1][12]
            track.averageCadence = csvData[1][13]
            track.averageStrideLength = csvData[1][14]
            track.runningIndex = csvData[1][15]
            track.ascent = csvData[1][17]
            track.descent = csvData[1][18]
            track.height = csvData[1][20]
            track.weight = csvData[1][21]
            track.hrMax = csvData[1][22]
            track.hrSit = csvData[1][23]
            track.vo2Max = csvData[1][24]

            for (var i = 3; i < csvData.length-1; i++){
                trackPoints.push({
                    sampleRate : csvData[i][0],
                    time : new Date('1970-01-01T' + csvData[i][1]+'Z').getTime() / 1000,
                    hr : csvData[i][2],
                    speed : csvData[i][3],
                    pace : csvData[i][4],
                    cadence : csvData[i][5],
                    altitude : csvData[i][6],
                    strideLength : csvData[i][7],
                    distances : csvData[i][8],
                    temperatures : csvData[i][9],
                    power : csvData[i][10]
                })
            }

            resolve()
        })
    })
}

readGPX = function(track, trackPoints, gpxData){

    return new Promise((resolve, reject)=>{
        track.gpsOn = true

        for (var i = 0; i < gpxData.trk[0].trkseg[0].trkpt.length && trackPoints[i]; i++){
            trackPoints[i].lattitude = parseFloat(gpxData.trk[0].trkseg[0].trkpt[i]['$'].lat)
            trackPoints[i].longitude = parseFloat(gpxData.trk[0].trkseg[0].trkpt[i]['$'].lon)
        }

        var lat = parseFloat(gpxData.trk[0].trkseg[0].trkpt[0]['$'].lat)
        var lon = parseFloat(gpxData.trk[0].trkseg[0].trkpt[0]['$'].lon)

        googleMaps.reverseGeocode({latlng: [lat, lon],result_type: "locality|country"}).asPromise()
            .then((response)=>{
                track.location = response.json.results[0]['formatted_address']
                resolve()
            })
            .catch((err)=>{
                reject(err.errors[0].message)
            })
    })
}

exports.feedGPX = function(track, trackPoints, gpxFile){

    return new Promise((resolve, reject)=>{

        fs.readFile(gpxFile, function(err,data){
            if (err) {resolve()}
            else {
                ParseString(data.toString(),(err,data)=>{
                    var gpxData = data.gpx

                    readGPX(track, trackPoints, gpxData)
                        .then(()=>{
                            resolve()
                        })
                        .catch((err)=>{
                            reject(err)
                        })
                })
            }
        })
    })
}

var readSummary = function (track, summary){

    track.sport = summary['detailed-sport-info']
    track.date = new Date(summary['start-time'])
    track.duration = Math.ceil(moment.duration(summary['duration']).asSeconds())
    track.totalDistance = summary.distance / 1000
    track.averageSpeed = (track.totalDistance / (track.duration / 3600)).toFixed(2)
    track.averageHeartRate =summary['heart-rate']['average']
    track.gpsOn = summary['has-route']
    track.calories = summary['calories']
}

var readSamples = function(track, trackPoints, samples){
    var trackPoint

    if (samples.hasOwnProperty('speed')){
        track.maxSpeed = samples.speed.reduce((a,b)=>{return Math.max(a,b)})
    }

    if (samples.hasOwnProperty('altitude')){
        var [ascent, descent] = ascentDescent(samples.altitude)
        track.ascent = (ascent).toFixed(0)
        track.descent = (descent).toFixed(0)
    }

    for (var i = 0; i < track.duration; i++){
        trackPoint = {time : i}
        for (key in samples){
            trackPoint[key] = samples[key][i]
        }
        trackPoints.push(trackPoint)
    }
}

exports.polar = function(values){
    const track = {}
    const trackPoints = []

    var data, summary, samples
    [data, summary, samples] = values
    readSummary(track, summary)
    readSamples(track, trackPoints, samples)

    return new Promise((resolve, reject)=>{
        if (track.gpsOn){
            ParseString(data.toString(),(err,data)=>{
                gpxData = data.gpx

                readGPX(track, trackPoints, gpxData).then(()=>{
                        resolve([track, trackPoints])
                    }).catch((err)=>{
                        reject(err)
                    })
            })
        }
        else {
            resolve([track,trackPoints])
        }
    })
}
