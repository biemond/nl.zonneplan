'use strict';

module.exports = {
  
  async getToken(email,password) {
   let url = 'https://app-api.zonneplan.nl/oauth/token';
   console.log('making call to get token')
  const token = await this.getData(url, email,password);
   console.log('we got token ',token)
  return this.getDevice(token)
},

async getDevice(tokens) {
 let url = 'https://app-api.zonneplan.nl/user-accounts/me';
 //console.log('making call to get device', token)
const token = ''
 const res =  await fetch(url, {
     method: 'GET',
     headers: {'Content-Type': 'application/json','x-app-version':'2.1.1', 'Authorization' :'Bearer '+token}
    });
   const resp = await res.json();
  // console.log('Response for device ',resp)
   return resp;

},

async getData(url,email,password) {
 const res =  await fetch(url, {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     referrerPolicy: "no-referrer",
     credentials: "include",
     body: JSON.stringify({ email: email,password:password,grant_type: "one_time_password" }),
   });
   const resp = await res.json();
  // console('got token data ',resp)
   return resp.access_token;
 }

};