'use strict';

const Homey = require('homey');
const apis = require('./api.js');

const RETRY_INTERVAL = 85 * 1000;
let timer;

module.exports = class SolarplanP1Device extends Homey.Device {

  async onInit() {
    this.log('SolarplanP1Device has been inited');

    let name = this.getData().id;
    this.log("device name id " + name);
    this.log("device name " + this.getName());

    this.pollP1();

    timer = this.homey.setInterval(() => {
      // poll device state from p1
      this.pollP1();
    }, RETRY_INTERVAL);

    // this.pollInvertor();
  }

  async onAdded() {
    this.log('SolarplanP1Device has been added');
  }

  async onSettings({ oldSettings: { }, newSettings: { }, changedKeys: { } }) {
    this.log('SolarplanP1Device settings where changed');
  }

  async onRenamed(name) {
    this.log('SolarplanP1Device was renamed');
  }

  async onDeleted() {
    this.log('SolarplanP1Device has been deleted');
    this.homey.clearInterval(timer);
  } // end onDeleted

  validResult(entry) {
    if (entry || entry == 0) {
      return true;
    }
    return false;
  }

  setValues(meta) {
    if (this.validResult(meta['electricity_last_measured_average_value'])) {
      this.addCapability('measure_power');
      var power = meta['electricity_last_measured_average_value'];
      console.log("power ", power);
      this.setCapabilityValue('measure_power', power);
    }
    if (this.validResult(meta['electricity_last_measured_delivery_value'])) {
      this.addCapability('measure_power.delivery');
      var power = meta['electricity_last_measured_delivery_value'];
      this.setCapabilityValue('measure_power.delivery', power);
    }
    if (this.validResult(meta['electricity_last_measured_production_value'])) {
      this.addCapability('measure_power.production');
      var power = meta['electricity_last_measured_production_value'];
      this.setCapabilityValue('measure_power.production', power);
    }    
    if (this.validResult(meta['electricity_last_measured_at'])) {
      this.addCapability('lastmeasured');
      var date = meta['electricity_last_measured_at'].substring(0, 19);
      this.setCapabilityValue('lastmeasured', date);
    }
    if (this.validResult(meta['electricity_last_measured_production_at'])) {
      this.addCapability('lastmeasured_production');
      var date = meta['electricity_last_measured_production_at'].substring(0, 19);
      this.setCapabilityValue('lastmeasured_production', date);
    }
  }

  async pollP1() {
    this.log("pollP1");

    let accessToken = this.homey.settings.get('access_token')
    let refreshToken = this.homey.settings.get('refresh_token')

    var unitID = this.getData().id;
    console.log("accessToken " + accessToken);
    console.log("refreshToken " + refreshToken);
    console.log("id " + unitID);
    let resp = await apis.getDevice(accessToken)
    if (resp.message == 'Unauthenticated.') {
      const res = await apis.getRefreshToken(refreshToken)
      console.log('log from refresh token')
      this.homey.settings.set('access_token', res.access_token, function (err) {
        if (err) return Homey.alert(err);
      });
      this.homey.settings.set('refresh_token', res.refresh_token, function (err) {
        if (err) return Homey.alert(err);
      });
      resp = await apis.getDevice(res.access_token)
    }
    if (typeof(resp.data.address_groups) !== 'undefined') {
      const meta = getContractData(resp.data.address_groups, unitID)
      console.log("meta data ", meta)
      if (meta) {
        this.setValues(meta)
      }
    }
  }
}

function getContractData(arrayOfGroups, id) {
  console.log('contract ', id);
  const filteredData = arrayOfGroups.map((element) => {
    return {
      connections: element.connections.map((connection) => {
        return { contracts: connection.contracts.find((contract) => contract.uuid == id) }
      }
      )
    }
  })
  for (var i = 0; i < filteredData.length; i++) {
    console.log('List of contract ', filteredData[i].connections);
    for (var a = 0; a < filteredData[i].connections.length; a++) {
      if ( filteredData[i].connections[a].contracts ){
        console.log('contract ', filteredData[i].connections[a]);
        console.log('List of contract ', filteredData[i].connections[a].contracts.meta);
        return filteredData[i].connections[a].contracts.meta
      }  
    }
  }

}
