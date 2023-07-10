'use strict';

const Homey = require('homey');
const apis = require('./api.js');

const RETRY_INTERVAL = 300 * 1000;
let timer;

module.exports = class SolarplanDevice extends Homey.Device {

  async onInit() {
    this.log('SolarplanDevice has been inited');

    let name = this.getData().id;
    this.log("device name id " + name);
    this.log("device name " + this.getName());

    this.pollInvertor();

    timer = this.homey.setInterval(() => {
      // poll device state from inverter
      this.pollInvertor();
    }, RETRY_INTERVAL);

    this.pollInvertor();
  }

  async onAdded() {
    this.log('SolarplanDevice has been added');
  }

  async onSettings({ oldSettings: { }, newSettings: { }, changedKeys: { } }) {
    this.log('SolarplanDevice settings where changed');
  }

  async onRenamed(name) {
    this.log('SolarplanDevice was renamed');
  }

  async onDeleted() {
    this.log('SolarplanDevice has been deleted');
    this.homey.clearInterval(timer);
  } // end onDeleted

  async pollInvertor() {
    this.log("pollInvertor");

    let accessToken = this.homey.settings.get('access_token')
    let refreshToken = this.homey.settings.get('refresh_token')

    var unitID = this.getData().id;
    console.log("accessToken " + accessToken);
    console.log("refreshToken " + refreshToken);
    console.log("id " + unitID);
    const resp = await apis.getDevice(accessToken)
    const meta = getContractData(resp.data.address_groups, unitID)
    console.log("meta data ", meta)
  }
}

function getContractData(arrayOfGroups,id) {
  const filteredData = arrayOfGroups.map((element) => {
    return {
      connections: element.connections.map((connection) => {
        return { contracts: connection.contracts.find((contract) => contract.uuid == id) }
      }

      )
    }
  })

  return filteredData[0].connections[0].contracts.meta

}
