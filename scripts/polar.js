const fetch = require('node-fetch');
const {oAuthConfig} = require('./../config')
const stash = require('stash')('data')
const Buffer = require('buffer').Buffer
const electronOauth2 = require('electron-oauth2');

exports.auth = function(){
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
            event.sender.send('polar-oauth-reply', token);
        }, err => {
            console.log('Error while getting token', err);
        });
}

exports.register = function(member_id){
    const headers = {
        'Content-Type':'application/xml',
        'Accept':'application/json',
        'Authorization': 'Bearer ' + stash.get('user-token').access_token
    };

    fetch('https://www.polaraccesslink.com/v3/users',
    {
        method: 'POST',
        headers: headers,
        body: '<?xml version="1.0" encoding="utf-8" ?><register><member-id>'+member_id+'</member-id> </register>'
    })
        .then(function(res) {
            console.log(res)
            return res;
        })
        .catch(function(err){
            console.log(err)
        })
        .then(function(body) {
            console.log(body);
        });
}


exports.getUser = function(){
    const user = stash.get('user-token')

    const headers = {
        'Accept':'application/json',
        'Authorization': 'Bearer ' + user.access_token
    };

    fetch('https://www.polaraccesslink.com/v3/users/'+user.x_user_id,
    {
        method: 'GET',
        headers: headers,
    })
        .then(function(res) {
            return res.json();
        })
        .catch(function(err){
            console.log(err)
        })
        .then(function(body) {
            console.log(body);
        });
}

exports.getNotifications = function(){

    const headers = {
        'Accept':'application/json',
        'Authorization': 'Basic ' + Buffer.from(oAuthConfig.clientId+':'+oAuthConfig.clientSecret).toString('base64')
    };

    fetch('https://www.polaraccesslink.com/v3/notifications',
    {
        method: 'GET',
        headers: headers,
    })
        .then(function(res) {
            return res.json();
        })
        .catch(function(err){
            console.log(err)
        })
        .then(function(body) {
            console.log(body);
        });
}

exports.createTransaction = function(){
    const user = stash.get('user-token')

    const headers = {
        'Accept':'application/json',
        'Authorization': 'Bearer ' + user.access_token
    };

    fetch('https://www.polaraccesslink.com/v3/users/'+user.x_user_id+'/exercise-transactions',
    {
        method: 'POST',
        headers: headers,
    })
        .then(function(res) {
            return res;
        })
        .catch(function(err){
            console.log(err)
        })
        .then(function(body) {
            console.log(body);
        });
}

// base 64 credential
// console.log(btoa(oAuthConfig.clientId+':'+oAuthConfig.clientSecret))
