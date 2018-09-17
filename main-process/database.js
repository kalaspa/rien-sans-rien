const Sequelize = require('sequelize');
const fs = require('fs');
const Promise = require('promise')
const path = require('path')
const {ipcMain} = require('electron')
const parse = require('./parser')


let mainWindow
let trackPointList = {}


module.exports = function(win){
    mainWindow = win

    return {commit: commit}
}

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

var addTrack = function(gpxFile, csvFile){

    return new Promise((resolve,reject)=>{
        var track = {}
        var trackPoints = []

        parse.feedCSV(track,trackPoints,csvFile).then(()=>{
            parse.feedGPX(track,trackPoints,gpxFile).then(()=>{
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

ipcMain.on('save-in-db',(event, gpxFile, csvFile)=>{
    if (csvFile){
        addTrack(gpxFile, csvFile)
            .then(()=>{
                event.sender.send('success-save')
            })
            .catch((err)=>{
                event.sender.send('error-save',err)
            })
    }
})

ipcMain.on('save-in-db-folder',(event, folder)=>{
    if (folder){
        var files = fs.readdirSync(folder);
        var promises = []

        for (file of files){
            if (".csv" == path.parse(file).ext){
                promises.push(addTrack(path.join(folder,path.parse(file).name+'.gpx'),path.join(folder,file)))
            }
        }
        Promise.all(promises)
            .then(()=>{
                event.sender.send('success-save')
            })
            .catch((err)=>{
                event.sender.send('error-save',err)
            })
    }
})

ipcMain.on('get-track-list',(event)=>{
    Track.findAll()
        .then((trackInstances)=>{
            tracks = []
            for (trackInstance of trackInstances){
                tracks.push(trackInstance.get({plain:true}))
            }
            tracks.sort((a,b)=>{return new Date(b.date).getTime() - new Date(a.date).getTime()})
            mainWindow.webContents.send('track-list-retrieved',tracks)
        })
})

ipcMain.on('get-track-points',(event,process,trackId)=>{
    if (trackPointList.hasOwnProperty(trackId)){
        event.sender.send('track-points-retrieved-'+process,trackPointList[trackId])
    }
    else {
        TrackPoint.findAll({where: {trackId: trackId}})
            .then((trackPointInstances)=>{

                trackPoints = []
                var duration
                for (trackPointInstance of trackPointInstances){
                    trackPoints.push(trackPointInstance.get({plain:true}))
                }
                trackPoints.sort((a,b)=>{return a.time - b.time})

                event.sender.send('track-points-retrieved-'+process,trackPoints)
                trackPointList[trackId] = trackPoints
            })
    }
})

ipcMain.on('update-name-in-db',(event,trackId,name)=>{
    if (trackId && name){
        Track.update(
            { location: name }, /* set attributes' value */
            { where: { id: trackId }}
        )
            .then(()=>{
                event.sender.send('success-update')
            })
            .catch((err)=>{
                event.sender.send('error-update',err)
            })
    }
})

ipcMain.on('delete-tracks',(event,selected)=>{
    if (selected.length > 0){
        Track.destroy({
            where: {
                id : {[Sequelize.Op.or]: selected}
            }
        })
            .then(()=>{
                event.sender.send('success-delete')
            })
            .catch((err)=>{
                event.sender.send('error-delete',err)
            })
    }
})
