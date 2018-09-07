const fetch = require('node-fetch');
const {oAuthConfig} = require('./../config')
const stash = require('stash')('data')
const Buffer = require('buffer').Buffer
const electronOauth2 = require('electron-oauth2');
const {ipcMain} = require("electron")
const path = require('path')
const db = require('./database')()
const Promise = require('promise')

var sampleCodes = {
    0 : 'hr',
    1 : 'speed',
    2 : 'cadence',
    3 : 'altitude',
    8 : 'pace',
    10 : 'distances'
}

var buildHeaders = function(requester){
    const headers = {'Accept':'application/json'}
    if (requester == "USER"){
        headers['Authorization'] = 'Bearer ' + stash.get('user-token').access_token
    }
    else if (requester == "CLIENT"){
        headers['Authorization']= 'Basic ' + Buffer.from(oAuthConfig.clientId+':'+oAuthConfig.clientSecret).toString('base64')
    }
    return headers
}

var send = function(url, method, headers, body=null){
    return fetch(url,
        {
            'method': method,
            'headers': headers,
            'body': body
        })
            .then(function(res) {
                return res.json();
            })
            .catch(function(err){
                console.log(err)
            })
}

var auth = function(){
    const windowParams = {
        alwaysOnTop: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false
        }
    };

    const polarOAuth = electronOauth2(oAuthConfig, windowParams);

    polarOAuth.getAccessToken({})
        .then(token => {
            stash.set('user-token',token)
        }, err => {
            console.log('Error while getting token', err);
        });
}

var register = function(member_id){
    const headers = buildHeaders("USER")
    const body = '<?xml version="1.0" encoding="utf-8" ?><register><member-id>'+member_id+'</member-id> </register>'

    send('https://www.polaraccesslink.com/v3/users', 'POST', headers, body)
        .then(function(body) {
            console.log(body);
        });
}


var getUser = function(){
    const user = stash.get('user-token')
    const headers = buildHeaders("USER")

    send('https://www.polaraccesslink.com/v3/users/'+user.x_user_id, 'GET', headers)
        .then(function(body) {
            console.log(body);
        });
}

var getNotifications = function(){

    const headers = buildHeaders("CLIENT")

    return send('https://www.polaraccesslink.com/v3/notifications', 'GET', headers)
}

var createTransaction = function(){
    const user = stash.get('user-token')
    const headers = buildHeaders("USER")

    return send('https://www.polaraccesslink.com/v3/users/'+user.x_user_id+'/exercise-transactions', 'POST', headers)
}

var listExercises = function(transactionId){
    const user = stash.get('user-token')
    const headers = buildHeaders("USER")

    return send('https://www.polaraccesslink.com/v3/users/'+user.x_user_id+'/exercise-transactions/'+transactionId, 'GET', headers)
}

var commit = function(transactionId){
    const user = stash.get('user-token')
    const headers = buildHeaders("USER")

    return send('https://www.polaraccesslink.com/v3/users/'+user.x_user_id+'/exercise-transactions/'+transactionId, 'PUT', headers)
}

var getGPX = function(exoURI){
    const user = stash.get('user-token')
    const headers = buildHeaders('USER')
    headers["Accept"] = 'application/gpx+xml'

    return fetch(exoURI+'/gpx',
        {
            'method': 'GET',
            'headers': headers,
        }).then(res=>{
            return res.text()
        })
}

var getSummary = function(exoURI){
    const user = stash.get('user-token')
    const headers = buildHeaders('USER')

    return send(exoURI, 'GET', headers)
}


var getSamples = function(exoURI){
    const user = stash.get('user-token')
    const headers = buildHeaders('USER')

    var samples = {}
    var promises = []

    return new Promise((resolve, reject)=>{
        send(exoURI + '/samples', 'GET', headers)
            .then((body)=>{
                for (sampleURI of body["samples"]){
                    promises.push(send(sampleURI, 'GET', headers))
                }
                Promise.all(promises).then(values=>{
                    for (body of values){
                        if (sampleCodes.hasOwnProperty(body['sample-type'])){
                            var sampleList = body['data'].split(',').map(parseFloat)
                            samples[sampleCodes[body['sample-type']]] = sampleList
                        }
                    }
                    resolve(samples)
                })
            })
    })
}


ipcMain.on('polar-activate',()=>{
    console.log("Test")
})

// getNotifications().then((body)=>{
//     var exercise = false
//     for (item of body['available-user-data']){
//         if (item['data-type'] == 'EXERCISE'){
//             exercise = true
//         }
//     }
//     if (exercise){
//         createTransaction().then((body)=>{
//             var transactionId = body["transaction-id"]
//             console.log(transactionId)
//             listExercises(transactionId).then((body)=>{
//                 for (exoURI of body["exercises"]){
//                     console.log(exoURI)
//                     var promises = []
//
//                     promises.push(getGPX(exoURI))
//                     promises.push(getSummary(exoURI))
//                     promises.push(getSamples(exoURI))
//
//                     Promise.all(promises).then(values=>{
//                         db.addPolarTrack(values[0], values[1], values[2])
//                             .then(()=>{
//                                 console.log('Done : ' + exoURI)
//                             })
//                     })
//                 }
//             })
//         })
//     }
// })
