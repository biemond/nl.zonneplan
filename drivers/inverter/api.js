'use strict';

module.exports = {

 async getDevice(token) {
 let url = 'https://app-api.zonneplan.nl/user-accounts/me';
 console.log('making call to get device')
//const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiNGIzYWI1ZDhmOTk5OWE5Yjk2MjM5NTQ2ZGM5NGYyOWVlMjNlYTU3YmM4MjRjZmRmOTA1NDlkNGIwNTMxM2U2NDc3NGM1YmZhNmY2MDY3MDMiLCJpYXQiOjE2ODg5MjUzOTkuMTUzNDksIm5iZiI6MTY4ODkyNTM5OS4xNTM0OTIsImV4cCI6MTY4ODk1NDE5OS4xMjc3NzYsInN1YiI6IjE3MzE2NyIsInNjb3BlcyI6W119.XqWWUbwq_jW7DlplcUNuUK4re3krAbuTYXViVN_Zmq8PIJHZvcFfFO-fOQbIFAJXx9yjmaDeahF2G8QbxCvkvvQzOvNTwAmhcK3ukEfZv8COLIm4IlE_tQVZGstSi_xgupvlsXW_jwjK_DnUV7zDTUDBD3nuHCu3je3U6m997T103qTJ7B2gfmU0MG-14aU0tZWUeKwV-tXDtYe-4l7C2RB-qWE_Nw54WBXZjvXERWqFL7OeWPGc2faZsQ5SZ1-AFrgZ50M1NZIuSnqN4llzp6T_GFiaqlP2UZIV3Nv34OSjmPLoUqwaGd5Up05-qRpSt0la9_DwQlRS0lcYSskFMdbJCjLz34OWTCDLuECpZUz_GZSIJ_scxlKO2S0-T6hvMwPqZf8yiVIJ2j6FsBEuThqHw9QSzqXFAV3CzvzP9x4-QLkh0RfB2gMdWlqdV4SBWp4l38v9wD5m7iPVBZjTmMpIZ6pyDL-SzUsVGzhRiwI9NlbzENP98_FlsO7e_Xc2edZ1aaPeJltntaK0fJRy2SMqFqhX7ChNM7bLmXAnt6HT1RUILeHGbEVVuKIWs2GSVmwVu1zBV0AwRooVP0vyL9XZhT_Ue2XQmMIXx8x2AP09B6lE65gkmARTV777Rdq35crMF2__AmjuMNvbWrFfBBPzhW03cB0Mk0pqmNHGPBs'
 const res =  await fetch(url, {
     method: 'GET',
     headers: {'Content-Type': 'application/json','x-app-version':'2.1.1', 'Authorization' :'Bearer '+token}
    });
   const resp = await res.json();
   return resp;

},

async getRefreshToken(token) {
    let url = 'https://app-api.zonneplan.nl/oauth/token';
   // console.log('making call to get getRefreshToken')
   //const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiNGIzYWI1ZDhmOTk5OWE5Yjk2MjM5NTQ2ZGM5NGYyOWVlMjNlYTU3YmM4MjRjZmRmOTA1NDlkNGIwNTMxM2U2NDc3NGM1YmZhNmY2MDY3MDMiLCJpYXQiOjE2ODg5MjUzOTkuMTUzNDksIm5iZiI6MTY4ODkyNTM5OS4xNTM0OTIsImV4cCI6MTY4ODk1NDE5OS4xMjc3NzYsInN1YiI6IjE3MzE2NyIsInNjb3BlcyI6W119.XqWWUbwq_jW7DlplcUNuUK4re3krAbuTYXViVN_Zmq8PIJHZvcFfFO-fOQbIFAJXx9yjmaDeahF2G8QbxCvkvvQzOvNTwAmhcK3ukEfZv8COLIm4IlE_tQVZGstSi_xgupvlsXW_jwjK_DnUV7zDTUDBD3nuHCu3je3U6m997T103qTJ7B2gfmU0MG-14aU0tZWUeKwV-tXDtYe-4l7C2RB-qWE_Nw54WBXZjvXERWqFL7OeWPGc2faZsQ5SZ1-AFrgZ50M1NZIuSnqN4llzp6T_GFiaqlP2UZIV3Nv34OSjmPLoUqwaGd5Up05-qRpSt0la9_DwQlRS0lcYSskFMdbJCjLz34OWTCDLuECpZUz_GZSIJ_scxlKO2S0-T6hvMwPqZf8yiVIJ2j6FsBEuThqHw9QSzqXFAV3CzvzP9x4-QLkh0RfB2gMdWlqdV4SBWp4l38v9wD5m7iPVBZjTmMpIZ6pyDL-SzUsVGzhRiwI9NlbzENP98_FlsO7e_Xc2edZ1aaPeJltntaK0fJRy2SMqFqhX7ChNM7bLmXAnt6HT1RUILeHGbEVVuKIWs2GSVmwVu1zBV0AwRooVP0vyL9XZhT_Ue2XQmMIXx8x2AP09B6lE65gkmARTV777Rdq35crMF2__AmjuMNvbWrFfBBPzhW03cB0Mk0pqmNHGPBs'
    const res =  await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json','x-app-version':'2.1.1'},
        body: JSON.stringify({ refresh_token: token,grant_type: "refresh_token" }),
       });
      const resp = await res.json();
     // console.log(resp)
      return resp;
   
   }



};