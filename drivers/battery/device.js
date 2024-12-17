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

  async onSettings({ oldSettings, newSettings, changedKeys }) {
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

  async setValues(meta, usageDetails) {
    const deviceState = this.getState();

    this.log('Meta Data: ', meta);
    this.log('Usage Details:', usageDetails);

    if (this.validResult(meta['state_of_charge'])) {
      if (!this.hasCapability()) await this.addCapability('measure_battery');

      const batteryPercentage = meta['state_of_charge'] / 10;
      this.log(`State_of_charge ${batteryPercentage}`);

      if (batteryPercentage !== null && !(typeof deviceState !== 'undefined' && typeof deviceState['measure_battery'] !== 'undefined' && deviceState['measure_battery'] === batteryPercentage)) {
        this.setCapabilityValue('measure_battery', batteryPercentage);
      }
    }

    let exportTotal = 0;
    let importTotal = 0;
    if (this.validResult(usageDetails.data[0]['meta']['delivery'])) {
      if (!this.hasCapability()) await this.addCapability('meter_power.import');

      importTotal = usageDetails.data[0]['meta']['delivery'] / 1000;
      this.log(`Total imported: ${importTotal}`);
      if (importTotal !== null && !(typeof deviceState !== 'undefined' && typeof deviceState['meter_power.import'] !== 'undefined' && deviceState['meter_power.import'] === importTotal)) {
        this.setCapabilityValue('meter_power.import', importTotal);
      }
    }

    if (this.validResult(usageDetails.data[0]['meta']['production'])) {
      if (!this.hasCapability()) await this.addCapability('meter_power.export');

      exportTotal = usageDetails.data[0]['meta']['production'] / 1000;
      this.log(`Total exported: ${exportTotal}`);
      if (exportTotal !== null && !(typeof deviceState !== 'undefined' && typeof deviceState['meter_power.export'] !== 'undefined' && deviceState['meter_power.export'] === exportTotal)) {
        this.setCapabilityValue('meter_power.export', exportTotal);
      }
    }

    const netUsage = importTotal - exportTotal;
    if (netUsage > 0) {
      if (!this.hasCapability()) await this.addCapability('meter_power');

      this.log(`Net usage: ${netUsage}`);
      if (netUsage !== null && !(typeof deviceState !== 'undefined' && typeof deviceState['meter_power'] !== 'undefined' && deviceState['meter_power'] === netUsage)) {
        this.setCapabilityValue('meter_power', netUsage);
      }
    }

    if (this.validResult(meta['power_ac'])) {
      if (!this.hasCapability()) await this.addCapability('measure_power');

      const powerMeasure = meta['power_ac'];
      this.log(`Power measure: ${powerMeasure}`);
      if (powerMeasure !== null && !(typeof deviceState !== 'undefined' && typeof deviceState['measure_power'] !== 'undefined' && deviceState['measure_power'] === powerMeasure)) {
        this.setCapabilityValue('measure_power', powerMeasure);
      }
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

      if (homeyBatteryState !== null && !(typeof deviceState !== 'undefined'
          && typeof deviceState['battery_charging_state'] !== 'undefined'
          && deviceState['battery_charging_state'] === homeyBatteryState)) {
        this.setCapabilityValue('battery_charging_state', homeyBatteryState);
      }
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async pollInvertor() {
    this.log('pollInvertor');
    await this.delay(5000);
    let accessToken = this.homey.settings.get('access_token');
    const refreshToken = this.homey.settings.get('refresh_token');

    const unitID = this.getData().id;
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

      accessToken = res.access_token;
      resp = await apis.getDevice(res.access_token);
    }

    if (resp !== undefined && resp.data !== undefined && Object.hasOwn(resp.data, 'address_groups')) {
      const meta = this.getContractData(resp.data.address_groups, unitID);
      const usageDetails = await apis.getBatteryUsageData(accessToken, unitID);

      if (meta) {
        await this.setValues(meta, usageDetails);
      }
    }
  }

  getContractData(arrayOfGroups, id) {
    this.log('Contract: ', id);
    this.log('Full API Results: ', JSON.stringify(arrayOfGroups[0].connections, null, 2));

    const filteredData = arrayOfGroups.map((element) => {
      return {
        connections: element.connections.map((connection) => {
          return { contracts: connection.contracts.find((contract) => contract.uuid === id) };
        }),
      };
    });

    for (let i = 0; i < filteredData.length; i++) {
      for (let a = 0; a < filteredData[i].connections.length; a++) {
        if (filteredData[i].connections[a].contracts) {
          return filteredData[i].connections[a].contracts.meta;
        }
      }
    }

    return null;
  }

};
