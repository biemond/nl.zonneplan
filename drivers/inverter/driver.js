'use strict';

const Homey = require('homey');
const apis = require('./api.js');

module.exports = class SolarplanDriver extends Homey.Driver {


  async onInit() {
  }

  async onPair(session) {

    let emailkey = this.homey.settings.get('email')
    let tempPasskey = this.homey.settings.get('password')
    console.log("email " + emailkey);
    console.log("pass " + tempPasskey);

    session.setHandler("list_devices", async function () {
      if (emailkey == null || tempPasskey == null) {
        new Error('Please activate email 1st in the app settings!');
        return [];
      } else {

        let devices = [];
       const resp = await apis.getDevice('')
       console.log('Get device in main call ',resp.data.address_groups[0].connections[0].uuid)
       const id = resp.data.address_groups[0].connections[0].uuid;
       var device = {
        name: id ,
        data: {
          id: id,
          name: id
        }
      };

        devices.push(device);

        console.log('List of devices ',devices);
        return devices;
      }
    });
  }



}
