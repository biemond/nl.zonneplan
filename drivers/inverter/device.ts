'use strict';

import Homey from 'homey';
import { ZonneplanApi } from '../../lib/ZonneplanApi';

module.exports = class SolarplanDevice extends Homey.Device {
  async onInit() {
    this.log('SolarplanDevice has been inited');

    let name = this.getData().id;
    this.log('device name id ' + name);
    this.log('device name ' + this.getName());
  }

  async onAdded() {
    this.log('SolarplanDevice has been added');
  }

  async onSettings({ oldSettings: {}, newSettings: {}, changedKeys: {} }) {
    this.log('SolarplanDevice settings where changed');
  }

  async onRenamed(name: string) {
    this.log('SolarplanDevice was renamed');
  }

  async onDeleted() {
    this.log('SolarplanDevice has been deleted');
  }

  validResult(entry: any) {
    if (entry || entry == 0) {
      return true;
    }
    return false;
  }

  setValues(meta: any) {
    if (this.validResult(meta['last_measured_power_value'])) {
      this.addCapability('measure_power');

      var power = meta['last_measured_power_value'];
      this.log('power ', power);
      this.setCapabilityValue('measure_power', power);
    }

    if (this.validResult(meta['total_power_measured'])) {
      this.addCapability('meter_power');

      var total = meta['total_power_measured'] / 1000;
      this.setCapabilityValue('meter_power', total);
    }

    if (this.validResult(meta['last_measured_at'])) {
      this.addCapability('lastmeasured');

      var date = meta['last_measured_at'].substring(0, 19);
      this.setCapabilityValue('lastmeasured', date);
    }

    if (this.validResult(meta['panel_wp'])) {
      this.addCapability('panel_wp');

      var panel = meta['panel_wp'];
      this.setCapabilityValue('panel_wp', panel);
    }

    if (this.validResult(meta['installation_wp'])) {
      this.addCapability('panel_total_wp');

      var panel = meta['installation_wp'];
      this.setCapabilityValue('panel_total_wp', panel);
    }

    if (this.validResult(meta['panel_count'])) {
      this.addCapability('panel_count');

      var panel = meta['panel_count'];
      this.setCapabilityValue('panel_count', panel);
    }
  }

  async syncDevice(metaData: any, zonneplanApi: ZonneplanApi) {
    const unitID = this.getData().id;
    this.log(`ID: ${unitID}`);

    const meta = zonneplanApi.getContractData(metaData, unitID);

    if (meta) {
      await this.setValues(meta);
    }
  }
};
