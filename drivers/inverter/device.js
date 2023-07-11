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

  validResult(entry) {
    if (entry) {
      return true;
    }
    return false;
  }

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
    if (this.validResult(meta['last_measured_power_value'])) {
      this.addCapability('measure_power');
      var power = meta['last_measured_power_value'];
      this.setCapabilityValue('measure_power', power);
    }
    if (this.validResult(meta['total_power_measured'])) {
      this.addCapability('meter_power');
      var power = meta['total_power_measured'];
      this.setCapabilityValue('meter_power', power);
    }
    if (this.validResult(meta['last_measured_at'])) {
      this.addCapability('lastmeasured');
      var power = meta['last_measured_at'];
      this.setCapabilityValue('lastmeasured', power);
    }  
    if (this.validResult(meta['panel_wp'])) {
      this.addCapability('panel_wp');
      var power = meta['panel_wp'];
      this.setCapabilityValue('panel_wp', power);
    }  
    if (this.validResult(meta['installation_wp'])) {
      this.addCapability('panel_total_wp');
      var power = meta['installation_wp'];
      this.setCapabilityValue('panel_total_wp', power);
    }  
    if (this.validResult(meta['panel_count'])) {
      this.addCapability('panel_count');
      var power = meta['panel_count'];
      this.setCapabilityValue('panel_count', power);
    }                      
  }
}

function getContractData(arrayOfGroups, id) {
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
