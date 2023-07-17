const Homey = require('homey');

class MyZonneplanApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('MyZonneplanApp has been initialized');
  }

  async activate(email) {
    const res = await fetch('https://app-api.zonneplan.nl/auth/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      referrerPolicy: "no-referrer",
      credentials: "include",
      body: JSON.stringify({ email: email }),
    });
    const resp = await res.json();
    return resp;
  }

  async getOTP(uuid) {
    console.log('uuid value ', uuid)
    const res = await fetch('https://app-api.zonneplan.nl/auth/request/' + uuid, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      referrerPolicy: "no-referrer",
      credentials: "include",
    });
    const resp = await res.json();
    return resp;
  }

  async getToken(email, password) {
    let url = 'https://app-api.zonneplan.nl/oauth/token';
    console.log('making call to get token')
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      referrerPolicy: "no-referrer",
      credentials: "include",
      body: JSON.stringify({ email: email, password: password, grant_type: "one_time_password" }),
    });
    const resp = await res.json();
    console.log('we got token ', resp)
    return resp;
  }

}

module.exports = MyZonneplanApp;
