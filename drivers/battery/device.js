'use strict';

const Homey = require('homey');
const apis = require('./api');

const RETRY_INTERVAL = 100 * 1000;
let timer;

module.exports = class SolarplanDevice extends Homey.Device {

  async onInit() {
    this.log('Battery has been initialized');

    const name = this.getData().id;
    this.log(`device name id ${name}`);
    this.log(`device name ${this.getName()}`);

    this.pollInvertor();

    timer = this.homey.setInterval(() => {
      // poll device state from inverter
      this.pollInvertor();
    }, RETRY_INTERVAL);
  }

  async onAdded() {
    this.log('Battery has been added');
  }

  async onSettings({ oldSettings: { }, newSettings: { }, changedKeys: { } }) {
    this.log('Battery settings where changed');
  }

  async onRenamed(name) {
    this.log('Battery was renamed');
  }

  async onDeleted() {
    this.log('Battery has been deleted');
    this.homey.clearInterval(timer);
  }

  validResult(entry) {
    if (entry || entry === 0) {
      return true;
    }
    return false;
  }

  async setValues(meta) {
    this.log(meta);

    if (this.validResult(meta['state_of_charge'])) {
      if (!this.hasCapability()) await this.addCapability('measure_battery');

      const batteryPercentage = meta['state_of_charge'] / 10;
      this.log(`State_of_charge ${batteryPercentage}`);
      this.setCapabilityValue('measure_battery', batteryPercentage);
    }

    if (this.validResult(meta['power_ac'])) {
      if (!this.hasCapability()) await this.addCapability('measure_power');

      const powerMeasure = meta['power_ac'];
      this.log(`Power measure: ${powerMeasure}`);
      this.setCapabilityValue('measure_power', powerMeasure);
    }

    if (this.validResult(meta['battery_state'])) {
      if (!this.hasCapability()) await this.addCapability('battery_charging_state');

      const batteryState = meta['battery_state'];
      this.log(`Battery state: ${batteryState}`);

      let homeyBatteryState = 'idle';
      switch (batteryState) {
        case 'Charging':
          homeyBatteryState = 'charging';
          break;
        case 'Discharging':
          homeyBatteryState = 'discharging';
          break;
        default:
          homeyBatteryState = 'idle';
          break;
      }

      this.setCapabilityValue('battery_charging_state', homeyBatteryState);
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async pollInvertor() {
    this.log('pollInvertor');
    await this.delay(5000);
    const accessToken = this.homey.settings.get('access_token');
    const refreshToken = this.homey.settings.get('refresh_token');

    const unitID = this.getData().id;
    this.log(`AccessToken: ${accessToken}`);
    this.log(`RefreshToken: ${refreshToken}`);
    this.log(`ID: ${unitID}`);

    let resp = await apis.getDevice(accessToken);

    if (resp.message === 'Unauthenticated.') {
      const res = await apis.getRefreshToken(refreshToken);

      this.homey.settings.set('access_token', res.access_token, (err) => {
        if (err) return Homey.alert(err);
        return null;
      });

      this.homey.settings.set('refresh_token', res.refresh_token, (err) => {
        if (err) return Homey.alert(err);
        return null;
      });

      resp = await apis.getDevice(res.access_token);
    }

    if (resp !== undefined && resp.data !== undefined && Object.hasOwn(resp.data, 'address_groups')) {
      const meta = this.getContractData(resp.data.address_groups, unitID);
      this.log('meta data ', meta);
      if (meta) {
        await this.setValues(meta);
      }
    }
  }

  getContractData(arrayOfGroups, id) {
    this.log('contract ', id);

    const filteredData = arrayOfGroups.map((element) => {
      return {
        connections: element.connections.map((connection) => {
          return { contracts: connection.contracts.find((contract) => contract.uuid === id) };
        }),
      };
    });

    for (let i = 0; i < filteredData.length; i++) {
      this.log('List of contract ', filteredData[i].connections);
      for (let a = 0; a < filteredData[i].connections.length; a++) {
        if (filteredData[i].connections[a].contracts) {
          this.log('Contract ', filteredData[i].connections[a]);
          this.log('List of contract ', filteredData[i].connections[a].contracts.meta);
          return filteredData[i].connections[a].contracts.meta;
        }
      }
    }

    return null;
  }

};
