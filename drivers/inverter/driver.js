'use strict';

const Homey = require('homey');

module.exports = class SolarplanDriver extends Homey.Driver {


  async onInit() {
  }

  async onPair(session) {

    session.setHandler("list_devices", async function () {
      let devices = [];
      var device = {
        "name": 'blabla',
        "data": {
          id: 'aa'
        }
      };
      devices.push(device);
      return devices;
    });
  }


}
