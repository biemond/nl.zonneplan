'use strict';

const Homey = require('homey');
const apis = require('./api.js');

module.exports = class SolarplanP1Driver extends Homey.Driver {

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
        new Error('Please activate tokens!');
        return [];
      } else {

        let devices = [];

        const resp = await apis.getDevice(accessToken)
        console.log(resp.message)
        if(resp.message == 'Unauthenticated.'){
          new Error('Please activate tokens!');
        return [];
        }
        dataObject.contractUUIDs = await getContractUUID(resp.data.address_groups);
        // console.log('List of contract ', dataObject.contractUUIDs[0].connections[0]);
        // console.log('List of contract ', dataObject.contractUUIDs[1].connections[0]);
        console.log('Length ', dataObject.contractUUIDs.length);
        for (var i = 0; i < dataObject.contractUUIDs.length; i++) {
          console.log('List of driver ', dataObject.contractUUIDs[i]);
          console.log('Length ', dataObject.contractUUIDs[i].connections.length);
          for (var a = 0; a < dataObject.contractUUIDs[i].connections.length; a++) {
            if ( dataObject.contractUUIDs[i].connections[a].contracts ){
              console.log('List of driver device ', dataObject.contractUUIDs[i].connections[a]);
              var device = {
                name: dataObject.contractUUIDs[i].connections[a].contracts.uuid,
                data: {
                  id: dataObject.contractUUIDs[i].connections[a].contracts.uuid,
                  name: dataObject.contractUUIDs[i].connections[a].contracts.uuid
                }
              };

              devices.push(device);
            }
          }
        }
        console.log('List of driver devices ',devices);
        return devices;
      }
    });
  }
}

function getContractUUID(arrayOfGroups) {
  const filteredData = arrayOfGroups.map((element) => {
    return {
      connections: element.connections.map((connection) => {
        return { contracts: connection.contracts.find((contract) => contract.type == 'p1_installation') }
      }

      )
    }
  })
  console.log('List of devices ',filteredData);
  return filteredData
}
