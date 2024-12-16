'use strict';

const Homey = require('homey');
const apis = require('./api');

module.exports = class SolarplanDriver extends Homey.Driver {

  async onInit() {
    this.log('Driver initialized');
  }

  async onPair(session) {
    const accessToken = this.homey.settings.get('access_token');
    const refreshToken = this.homey.settings.get('refresh_token');
    this.log(`accessToken ${accessToken}`);
    this.log(`refreshToken ${refreshToken}`);
    const dataObject = {};
    session.setHandler('list_devices', async () => {
      if (accessToken == null || refreshToken == null) {
        throw Error('Please activate tokens!');
      }

      const devices = [];
      const resp = await apis.getDevice(accessToken);
      this.log(resp.message);

      if (resp.message === 'Unauthenticated.') {
        throw new Error('Please activate tokens!');
      }

      dataObject.contractUUIDs = await this.getContractUUID(resp.data.address_groups);

      // console.log('response ',resp.data.address_groups);
      // console.log('List of contract ', dataObject.contractUUIDs[0].connections[0]);
      // console.log('List of contract ', dataObject.contractUUIDs[1].connections[0]);
      this.log('Length ', dataObject.contractUUIDs.length);
      for (let i = 0; i < dataObject.contractUUIDs.length; i++) {
        this.log('List of driver ', dataObject.contractUUIDs[i]);
        this.log('Length ', dataObject.contractUUIDs[i].connections.length);

        for (let a = 0; a < dataObject.contractUUIDs[i].connections.length; a++) {
          for (let b = 0; b < dataObject.contractUUIDs[i].connections[a].contracts.length; b++) {
            if (dataObject.contractUUIDs[i].connections[a].contracts[b]) {
              this.log('List of driver contract device ', dataObject.contractUUIDs[i].connections[a].contracts[b]);

              const device = {
                name: dataObject.contractUUIDs[i].connections[a].contracts[b].uuid,
                data: {
                  id: dataObject.contractUUIDs[i].connections[a].contracts[b].uuid,
                  name: dataObject.contractUUIDs[i].connections[a].contracts[b].uuid,
                },
              };

              devices.push(device);
            }
          }
        }
      }

      this.log('List of driver devices:', devices);
      return devices;
    });
  }

  async getContractUUID(arrayOfGroups) {
    const filteredData = arrayOfGroups.map((element) => {
      return {
        connections: element.connections.map((connection) => {
          return { contracts: connection.contracts.filter((contract) => contract.type == 'home_battery_installation') };
        }),
      };
    });

    this.log('List of devices:', filteredData);
    return filteredData;
  }

};
