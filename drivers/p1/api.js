'use strict';

const fetch = require('node-fetch');

module.exports = {
    async getDevice(token) {
        let url = 'https://app-api.zonneplan.nl/user-accounts/me';
        console.log('making call to get device')
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'x-app-version': '2.1.1', 'Authorization': 'Bearer ' + token }
        });
        const resp = await res.json();
        return resp;
    },

    async getGas(token,uuid) {
        let url = 'https://app-api.zonneplan.nl/connections/'+uuid+'/gas';
        console.log('making gas call to get device')
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'x-app-version': '2.1.1', 'Authorization': 'Bearer ' + token }
        });
        const resp = await res.json();
        return resp;
    },

    async getElec(token,uuid) {
        let url = 'https://app-api.zonneplan.nl/connections/'+uuid+'/electricity-delivered';
        console.log('making elec call to get device')
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'x-app-version': '2.1.1', 'Authorization': 'Bearer ' + token }
        });
        const resp = await res.json();
        return resp;
    },

    
    async getRefreshToken(token) {
        let url = 'https://app-api.zonneplan.nl/oauth/token';
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-app-version': '2.1.1' },
            body: JSON.stringify({ refresh_token: token, grant_type: "refresh_token" }),
        });
        const resp = await res.json();
        // console.log(resp)
        return resp;
    }
};