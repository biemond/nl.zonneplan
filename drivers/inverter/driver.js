'use strict';

const Homey = require('homey');

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

        var device = {
          name: "bla",
          data: {
            id: "bla",
            name: "bla"
          }
        };
        devices.push(device);

        console.log(devices);
        return devices;
      }
    });
  }


}
