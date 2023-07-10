'use strict';

const Homey = require('homey');
const apis = require('./api.js');

module.exports = class SolarplanDriver extends Homey.Driver {

  async onInit() {
  }

  async onPair(session) {

    let accessToken = this.homey.settings.get('access_token')
    let refreshToken = this.homey.settings.get('refresh_token')
    console.log("accessToken " + accessToken);
    console.log("refreshToken " + refreshToken);
    let dataObject = {}
    session.setHandler("list_devices", async function () {
      if (accessToken == null || refreshToken == null) {
        new Error('Please activate email 1st in the app settings!');
        return [];
      } else {

        let devices = [];

        const resp = await apis.getDevice(accessToken)
        dataObject.contractUUID = getContractUUID(resp.data.address_groups);

        var device = {
          name: dataObject.contractUUID,
          data: {
            id: dataObject.contractUUID,
            name: dataObject.contractUUID
          }
        };

        devices.push(device);

        // console.log('List of devices ',devices);
        return devices;
      }
    });
  }
}

function getContractUUID(arrayOfGroups) {
  const filteredData = arrayOfGroups.map((element) => {
    return {
      connections: element.connections.map((connection) => {
        return { contracts: connection.contracts.find((contract) => contract.type == 'pv_installation') }
      }

      )
    }
  })

  return filteredData[0].connections[0].contracts.uuid

}
