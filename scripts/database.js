const Sequelize = require('sequelize');
const fs = require('fs');
const Papa = require('papaparse')
const Promise = require('promise')
const {googleApiKey} = require('./../config')
const d3 = require('d3')
const path = require('path')

const googleMaps = require('@google/maps').createClient({
    key : googleApiKey,
    Promise: Promise,
    rate: {limit: 50},
});

var ParseString = require('xml2js').parseString;

const sequelize = new Sequelize('database', 'username', 'password', {
  dialect: 'sqlite',
  operatorsAliases: false,
  storage: 'ressources/track.sqlite',
  logging: false
});


const Track = sequelize.define('track', {
    name : Sequelize.STRING ,
    sport : Sequelize.STRING ,
    date : {type: Sequelize.DATE, unique: true},
    duration : Sequelize.FLOAT ,
    totalDistance : {type: Sequelize.FLOAT , allowNull: true},
    averageHeartRate : {type: Sequelize.FLOAT, allowNull:true} ,
    averageSpeed : {type: Sequelize.FLOAT, allowNull:true} ,
    maxSpeed : {type: Sequelize.FLOAT, allowNull:true} ,
    averagePace : {type: Sequelize.FLOAT, allowNull:true} ,
    maxPace : {type: Sequelize.FLOAT, allowNull:true} ,
    calories : Sequelize.FLOAT ,
    fatPercentageOfCalories : Sequelize.FLOAT ,
    averageCadence : {type: Sequelize.FLOAT, allowNull:true} ,
    averageStrideLength : {type: Sequelize.FLOAT, allowNull:true} ,
    runningIndex : {type: Sequelize.FLOAT, allowNull:true} ,
    trainingLoad : Sequelize.STRING ,
    ascent : {type: Sequelize.FLOAT, allowNull: true} ,
    descent : {type: Sequelize.FLOAT, allowNull: true} ,
    notes : Sequelize.TEXT ,
    height : Sequelize.FLOAT ,
    weight : Sequelize.FLOAT ,
    hrMax : Sequelize.FLOAT ,
    hrSit : Sequelize.FLOAT ,
    vo2Max : Sequelize.FLOAT,
    location : {type: Sequelize.STRING, allowNull:true},
    gpsOn : {type: Sequelize.BOOLEAN, default: false},
});

const TrackPoint = sequelize.define('trackPoint', {
    time : Sequelize.FLOAT ,
    hr : {type: Sequelize.FLOAT, allowNull:true} ,
    speed : {type: Sequelize.FLOAT, allowNull:true} ,
    pace : {type: Sequelize.FLOAT, allowNull:true} ,
    cadence : {type: Sequelize.FLOAT, allowNull:true} ,
    altitude : {type: Sequelize.FLOAT, allowNull:true} ,
    strideLength : {type: Sequelize.FLOAT, allowNull:true} ,
    distances : {type: Sequelize.FLOAT, allowNull:true} ,
    lattitude : {type: Sequelize.FLOAT, allowNull:true} ,
    longitude : {type: Sequelize.FLOAT, allowNull:true}
})

TrackPoint.belongsTo(Track)
Track.hasMany(TrackPoint)

var parseNullString = function(inputString){
    return "null".toUpperCase() == inputString.toUpperCase() ? null : inputString
}

sequelize.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

sequelize.sync()
    .then(() => {
        console.log("All synced")
    })
    .catch(error => {
        console.log("Couldn't synchronize the database")
    })

var feedCSV = function(track, trackPoints, csvFile){
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

var feedGPX = function(track, trackPoints, gpxFile){

    return new Promise((resolve, reject)=>{

        fs.readFile(gpxFile, function(err,data){
            if (err) {resolve()}
            else {
                ParseString(data.toString(),(err,data)=>{
                    var gpxData = data.gpx

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
            })
        })
}

var commit = function(track, trackPoints){
    return new Promise((resolve,reject)=>{
        Track.create(track)
            .then(tk => {
                TrackPoint.bulkCreate(trackPoints)
                    .then((tkPts) => {
                        tk.setTrackPoints(tkPts)
                            .then(() => {
                                resolve()
                            })
                            .catch((err)=>{
                                reject(err.errors[0].message)
                            })
                    })
                    .catch((err)=>{
                        reject(err)
                    })
            })
            .catch((err)=>{
                console.log("File already in database")
                resolve()
            })
    })
}

exports.addTrack = function(gpxFile, csvFile){

    return new Promise((resolve,reject)=>{
        var track = {}
        var trackPoints = []

        feedCSV(track,trackPoints,csvFile).then(()=>{
            feedGPX(track,trackPoints,gpxFile).then(()=>{
                commit(track, trackPoints)
                    .then(()=>{
                        resolve()
                    })
                    .catch((err)=>{
                        reject(err)
                    })
            })
            .catch((err)=>{
                reject(err)
            })
        })
        .catch((err)=>{
            reject(err)
        })
    })
}

exports.addFolder = function(folder){
    return new Promise((resolve, reject)=>{
        var files = fs.readdirSync(folder);
        var promises = []

        for (file of files){
            if (".csv" == path.parse(file).ext){
                promises.push(exports.addTrack(path.join(folder,path.parse(file).name+'.gpx'),path.join(folder,file)))
            }
        }
        Promise.all(promises)
            .then(()=>{
                resolve()
            })
            .catch((err)=>{
                reject(err)
            })
    })
}

exports.getTrackList = function(){
    return new Promise(function(resolve,reject){
        Track.findAll().then(tracks => {
          resolve(tracks)
        })
    })
}

exports.getTrackPoints = function(trackId){
    return new Promise((resolve,reject)=>{
        TrackPoint.findAll({where: {trackId: trackId}})
            .then((trackPoints)=>{
                resolve(trackPoints)
            })
            .catch((err)=>{
                reject(err)
            })
    })
}


exports.updateName = function(trackId,newName){
    return Track.update(
        { location: newName }, /* set attributes' value */
        { where: { id: trackId }}
    )
}
