'use strict';

import Homey from 'homey';
import { ZonneplanApi } from '../../lib/ZonneplanApi';
import { formatDateTime } from '../../lib/helpers';

module.exports = class SolarplanDevice extends Homey.Device {
  async onInit() {
    this.log('Battery has been initialized');

    // Get energy object for devices that are already in use
    let energy = await this.getEnergy();

    /* Enable home battery energy settings (for old devices) */
    if (energy === null || energy.homeBattery === null || energy.meterPowerImportedCapability === null || energy.meterPowerExportedCapability === null) {
      energy = {
        homeBattery: true,
        meterPowerImportedCapability: 'meter_power.import',
        meterPowerExportedCapability: 'meter_power.export',
      };

      await this.setEnergy(energy);
    }

    const name = this.getData().id;
    this.log(`device name id ${name}`);
    this.log(`device name ${this.getName()}`);
  }

  async onAdded() {
    this.log('Battery has been added');
  }

  async onSettings({
    oldSettings,
    newSettings,
    changedKeys,
  }: {
    oldSettings: {
      [key: string]: boolean | string | number | undefined | null;
    };
    newSettings: {
      [key: string]: boolean | string | number | undefined | null;
    };
    changedKeys: string[];
  }): Promise<string | void> {
    this.log('Battery settings where changed');
  }

  async onRenamed(name: string) {
    this.log('Battery was renamed');
  }

  async onDeleted() {
    this.log('Battery has been deleted');
  }

  validResult(entry: any) {
    if (entry || entry === 0) {
      return true;
    }
    return false;
  }

  async setValues(meta: any, usageDetails: any, battDetails: any) {
    const deviceState = this.getState();

    this.log('Meta Data: ', meta);
    this.log('Usage Details:', usageDetails);
    this.log('Battery Details:', battDetails);

    if (this.validResult(meta['state_of_charge'])) {
      if (!this.hasCapability('measure_battery')) await this.addCapability('measure_battery');

      const batteryPercentage = meta['state_of_charge'] / 10;
      this.log(`State_of_charge ${batteryPercentage}`);

      if (batteryPercentage !== null && !(typeof deviceState !== 'undefined' && typeof deviceState['measure_battery'] !== 'undefined' && deviceState['measure_battery'] === batteryPercentage)) {
        this.setCapabilityValue('measure_battery', batteryPercentage);
      }
    }

    let exportTotal = 0;
    let importTotal = 0;
    if (this.validResult(usageDetails.data[0]['meta']['delivery'])) {
      if (!this.hasCapability('meter_power.import')) await this.addCapability('meter_power.import');

      importTotal = usageDetails.data[0]['meta']['delivery'] / 1000;
      this.log(`Total imported: ${importTotal}`);
      if (importTotal !== null && !(typeof deviceState !== 'undefined' && typeof deviceState['meter_power.import'] !== 'undefined' && deviceState['meter_power.import'] === importTotal)) {
        this.setCapabilityValue('meter_power.import', importTotal);
      }
    }

    if (this.validResult(usageDetails.data[0]['meta']['production'])) {
      if (!this.hasCapability('meter_power.export')) await this.addCapability('meter_power.export');

      exportTotal = usageDetails.data[0]['meta']['production'] / 1000;
      this.log(`Total exported: ${exportTotal}`);
      if (exportTotal !== null && !(typeof deviceState !== 'undefined' && typeof deviceState['meter_power.export'] !== 'undefined' && deviceState['meter_power.export'] === exportTotal)) {
        this.setCapabilityValue('meter_power.export', exportTotal);
      }
    }

    const netUsage = importTotal - exportTotal;
    if (netUsage > 0) {
      if (!this.hasCapability('meter_power')) await this.addCapability('meter_power');

      this.log(`Net usage: ${netUsage}`);
      if (netUsage !== null && !(typeof deviceState !== 'undefined' && typeof deviceState['meter_power'] !== 'undefined' && deviceState['meter_power'] === netUsage)) {
        this.setCapabilityValue('meter_power', netUsage);
      }
    }

    if (this.validResult(meta['power_ac'])) {
      if (!this.hasCapability('measure_power')) await this.addCapability('measure_power');

      const powerMeasure = meta['power_ac'];
      this.log(`Power measure: ${powerMeasure}`);
      if (powerMeasure !== null && !(typeof deviceState !== 'undefined' && typeof deviceState['measure_power'] !== 'undefined' && deviceState['measure_power'] === powerMeasure)) {
        this.setCapabilityValue('measure_power', powerMeasure);
      }
    }

    if (this.validResult(meta['inverter_state'])) {
      if (!this.hasCapability('boolean.onoff')) await this.addCapability('boolean.onoff');

      const inverterState = meta['inverter_state'];
      this.log(`Inverter state: ${inverterState}`);

      let batteryStateOn = false;
      switch (inverterState) {
        case 'Operative':
          batteryStateOn = true;
          break;
        default:
          batteryStateOn = false;
          break;
      }

      if (batteryStateOn !== null && !(typeof deviceState !== 'undefined' && typeof deviceState['boolean.onoff'] !== 'undefined' && deviceState['boolean.onoff'] === batteryStateOn)) {
        this.setCapabilityValue('boolean.onoff', batteryStateOn);
      }
    }

    if (this.validResult(meta['last_measured_at'])) {
      if (!this.hasCapability('lastmeasured')) await this.addCapability('lastmeasured');

      const lastMeasuredAt = meta['last_measured_at'];
      if (lastMeasuredAt !== null && !(typeof deviceState !== 'undefined' && typeof deviceState['lastmeasured'] !== 'undefined' && deviceState['lastmeasured'] === lastMeasuredAt)) {
        this.setCapabilityValue('lastmeasured', formatDateTime(this.homey.clock, lastMeasuredAt));
      }
    }

    if (this.validResult(meta['cycle_count'])) {
      if (!this.hasCapability('cycle_count')) await this.addCapability('cycle_count');

      const cycleCount = meta['cycle_count'];
      if (cycleCount !== null && !(typeof deviceState !== 'undefined' && typeof deviceState['cycle_count'] !== 'undefined' && deviceState['cycle_count'] === cycleCount)) {
        this.setCapabilityValue('cycle_count', cycleCount);
      }
    }

    if (this.validResult(meta['battery_state'])) {
      if (!this.hasCapability('battery_charging_state')) await this.addCapability('battery_charging_state');

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

      if (
        homeyBatteryState !== null &&
        !(typeof deviceState !== 'undefined' && typeof deviceState['battery_charging_state'] !== 'undefined' && deviceState['battery_charging_state'] === homeyBatteryState)
      ) {
        this.setCapabilityValue('battery_charging_state', homeyBatteryState);
      }
    }

    if (typeof meta['dynamic_load_balancing_enabled'] !== 'undefined') {
      if (!this.hasCapability('boolean.dynamicloadbalancing')) await this.addCapability('boolean.dynamicloadbalancing');

      const dlbEnabled = meta['dynamic_load_balancing_enabled'];
      this.log(`Dynamic Load Balancing Enabled? ${dlbEnabled}`);

      if (
        dlbEnabled !== null &&
        !(typeof deviceState !== 'undefined' && typeof deviceState['boolean.dynamicloadbalancing'] !== 'undefined' && deviceState['boolean.dynamicloadbalancing'] === dlbEnabled)
      ) {
        this.setCapabilityValue('boolean.dynamicloadbalancing', dlbEnabled);
      }
    }

    if (typeof meta['dynamic_load_balancing_overload_active'] !== 'undefined') {
      if (!this.hasCapability('boolean.dynamicloadbalancingactive')) await this.addCapability('boolean.dynamicloadbalancingactive');

      const dlbActivated = meta['dynamic_load_balancing_overload_active'];
      this.log(`Dynamic Load Balancing Activated? ${dlbActivated}`);

      if (
        dlbActivated !== null &&
        !(typeof deviceState !== 'undefined' && typeof deviceState['boolean.dynamicloadbalancingactive'] !== 'undefined' && deviceState['boolean.dynamicloadbalancingactive'] === dlbActivated)
      ) {
        this.setCapabilityValue('boolean.dynamicloadbalancingactive', dlbActivated);
      }
    }

    let exportDay = 0;
    let importDay = 0;
    if (this.validResult(battDetails['delivery_day'])) {
      if (!this.hasCapability('meter_power.daily_import')) await this.addCapability('meter_power.daily_import');

      importDay = battDetails['delivery_day'] / 1000;
      this.log(`Total daily imported: ${importDay}`);
      if (importDay !== null && !(typeof deviceState !== 'undefined' && typeof deviceState['meter_power.daily_import'] !== 'undefined' && deviceState['meter_power.daily_import'] === importDay)) {
        this.setCapabilityValue('meter_power.daily_import', importDay);
      }
    }

    if (this.validResult(battDetails['production_day'])) {
      if (!this.hasCapability('meter_power.daily_export')) await this.addCapability('meter_power.daily_export');

      exportDay = battDetails['production_day'] / 1000;
      this.log(`Total exported: ${exportDay}`);
      if (exportDay !== null && !(typeof deviceState !== 'undefined' && typeof deviceState['meter_power.daily_export'] !== 'undefined' && deviceState['meter_power.daily_export'] === exportDay)) {
        this.setCapabilityValue('meter_power.daily_export', exportDay);
      }
    }

    if (this.validResult(battDetails['total_day'])) {
      if (!this.hasCapability('meter_power.daily_earned')) await this.addCapability('meter_power.daily_earned');

      const earnedDay = battDetails['total_day'] / 10000000;
      if (earnedDay !== null && !(typeof deviceState !== 'undefined' && typeof deviceState['meter_power.daily_earned'] !== 'undefined' && deviceState['meter_power.daily_earned'] === earnedDay)) {
        this.setCapabilityValue('meter_power.daily_earned', earnedDay);
      }
    }

    if (this.validResult(battDetails['total_earned'])) {
      if (!this.hasCapability('meter_power.total_earned')) await this.addCapability('meter_power.total_earned');

      const earnedTotal = battDetails['total_earned'] / 10000000;
      if (earnedTotal !== null && !(typeof deviceState !== 'undefined' && typeof deviceState['meter_power.total_earned'] !== 'undefined' && deviceState['meter_power.total_earned'] === earnedTotal)) {
        this.setCapabilityValue('meter_power.total_earned', earnedTotal);
      }
    }

    if (this.validResult(battDetails['battery_state'])) {
      if (!this.hasCapability('batterystate')) await this.addCapability('batterystate');

      const state = battDetails['battery_state'];
      if (state !== null && !(typeof deviceState !== 'undefined' && typeof deviceState['batterystate'] !== 'undefined' && deviceState['batterystate'] === state)) {
        this.setCapabilityValue('batterystate', state);
      }
    }

    if (this.validResult(battDetails['inverter_state'])) {
      if (!this.hasCapability('inverterstate')) await this.addCapability('inverterstate');

      const state = battDetails['inverter_state'];
      if (state !== null && !(typeof deviceState !== 'undefined' && typeof deviceState['inverterstate'] !== 'undefined' && deviceState['inverterstate'] === state)) {
        this.setCapabilityValue('inverterstate', state);
      }
    }
  }

  async syncDevice(metaData: any, zonneplanApi: ZonneplanApi) {
    const unitID = this.getData().id;
    this.log(`ID: ${unitID}`);

    const mainUuid = zonneplanApi.getConnectionData(metaData, unitID);
    const meta = zonneplanApi.getContractData(metaData, unitID);
    const usageDetails = await zonneplanApi.getBatteryUsageData(unitID);
    const battDetails = await zonneplanApi.getBatteryUsageData2(mainUuid, unitID);

    if (meta) {
      await this.setValues(meta, usageDetails, battDetails.data.contracts[0].meta);
    }
  }
};
