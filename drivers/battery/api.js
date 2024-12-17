'use strict';

const fetch = require('node-fetch');

module.exports = {
  async getDevice(token) {
    const url = 'https://app-api.zonneplan.nl/user-accounts/me';
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-app-version': '2.1.1', Authorization: `Bearer ${token}` },
    });
    const resp = await res.json();
    return resp;
  },

  async getRefreshToken(token) {
    const url = 'https://app-api.zonneplan.nl/oauth/token';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-app-version': '2.1.1' },
      body: JSON.stringify({ refresh_token: token, grant_type: 'refresh_token' }),
    });
    const resp = await res.json();
    // console.log(resp)
    return resp;
  },

  async getBatteryUsageData(token, uuid) {
    const url = `https://app-api.zonneplan.nl/contracts/${uuid}/home_battery_installation/charts/days_cumulative?date=2024-01-01`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-app-version': '2.1.1', Authorization: `Bearer ${token}` },
    });
    const resp = await res.json();
    return resp;
  },
};
