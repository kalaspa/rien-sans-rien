const fetch = require('node-fetch');
const {oAuthConfig} = require('./../config')
const stash = require('stash')('data')
const Buffer = require('buffer').Buffer
const electronOauth2 = require('electron-oauth2');
const {ipcMain} = require("electron")
const Promise = require('promise')
const parse = require('./parser')

let mainWindow

module.exports = function(win){
    mainWindow = win
}

var sampleCodes = {
    0 : 'hr',
    1 : 'speed',
    2 : 'cadence',
    3 : 'altitude',
    8 : 'pace',
    10 : 'distances'
}

var polar_urls = {
    user: 'https://www.polaraccesslink.com/v3/users',
    notifications: "https://www.polaraccesslink.com/v3/notifications",
    transaction: (user_id) => {return ('https://www.polaraccesslink.com/v3/users/'+user_id+'/exercise-transactions')},
    transactionId: (user_id, trans_id) =>{return ('https://www.polaraccesslink.com/v3/users/'+user_id+'/exercise-transactions/'+trans_id)}
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

    return new Promise((resolve,reject)=>{
        polarOAuth.getAccessToken({})
            .then(token => {
                stash.set('user-token',token)
                const headers = buildHeaders("USER")
                // TODO: Give sensible member-id
                const body = '<?xml version="1.0" encoding="utf-8" ?><register><member-id>user1</member-id> </register>'

                fetch(polar_urls.user,{'method': 'POST','headers': headers,'body': body}).then(()=>{
                    resolve()
                }).catch((err)=>{
                    reject(err)
                })

            }, err => {
                reject(err)
            });
    })
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
            .catch(err=>{reject(err)})
    })
}

var Transaction = {
    init : function(){
        const user = stash.get('user-token')
        const headers_client = buildHeaders("CLIENT")
        const headers_user = buildHeaders("USER")

        return new Promise((resolve,reject)=>{
            send(polar_urls.notifications, 'GET', headers_client).then((body)=>{
                var exercise
                for (item of body['available-user-data']){
                    if (item['data-type'] == 'EXERCISE'){exercise = true}
                }
                if (exercise){
                    send(polar_urls.transaction(user.x_user_id), 'POST', headers_user).then((body)=>{
                        this.transactionId = body["transaction-id"]
                        console.log(this.transactionId)
                        resolve()
                    })
                }
                else {
                    reject("No new exercise")
                }
            }).catch((error)=>{
                reject(error)
            })
        })
    },

    commit: function(){
        const user = stash.get('user-token')
        const headers = buildHeaders("USER")

        return send(polar_urls.transactionId(user.x_user_id,this.transactionId), 'PUT', headers)
    },

    listExercises: function(){
        const user = stash.get('user-token')
        const headers = buildHeaders('USER')

        return new Promise((resolve, reject)=>{
            send(polar_urls.transactionId(user.x_user_id,this.transactionId), 'GET', headers).then((body)=>{
                resolve(body["exercises"])
            }).catch(err=>{
                reject(err)
            })
        })
    },

    downloadExercise: function(url){
        const headers = buildHeaders('USER')

        return new Promise((resolve,reject)=>{
            var promises = []

            // GPX
            promises.push(getGPX(url))
            // Summary
            promises.push(send(url, 'GET', headers))
            // Samples
            promises.push(getSamples(url))

            Promise.all(promises).then(values=>{
                resolve(values)
            })
            .catch((error)=>{
                reject(error)
            })
        })
    }
}


ipcMain.on('polar-activate',()=>{
    var trans = Object.create(Transaction)
    const db = require('./database')(mainWindow)

    auth().then(()=>{
        trans.init().then(()=>{
            trans.listExercises().then((urls)=>{
                for (url of urls){
                    trans.downloadExercise(url).then((values)=>{
                        parse.polar(values).then(([track,trackPoints])=>{
                            db.commit(track,trackPoints).then(()=>{
                                trans.commit().then(()=>{
                                    console.log("Done")
                                })
                            })
                        }).catch(err=>{console.log(err)})
                    }).catch(err=>{console.log(err)})
                }
            }).catch(err=>{console.log(err)})
        }).catch(err=>{console.log(err)})
    }).catch((err)=>{console.log(err)})
})
