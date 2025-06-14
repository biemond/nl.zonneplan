'use strict';

import Homey from 'homey';
import { ZonneplanApi } from '../../lib/ZonneplanApi';

module.exports = class SolarplanP1Device extends Homey.Device {
  async onInit() {
    this.log('SolarplanP1Device has been inited');

    let name = this.getData().id;
    this.log('device name id ' + name);
    this.log('device name ' + this.getName());
  }

  async onAdded() {
    this.log('SolarplanP1Device has been added');
  }

  async onSettings({ oldSettings: {}, newSettings: {}, changedKeys: {} }) {
    this.log('SolarplanP1Device settings where changed');
  }

  async onRenamed(name: string) {
    this.log('SolarplanP1Device was renamed');
  }

  async onDeleted() {
    this.log('SolarplanP1Device has been deleted');
  }

  validResult(entry: any) {
    if (entry) {
      return true;
    }
    return false;
  }

  async setValues(meta: any) {
    if (!this.hasCapability('measure_power')) await this.addCapability('measure_power');
    var powerAvg = meta['electricity_last_measured_average_value'];
    this.log('power ', powerAvg);
    this.setCapabilityValue('measure_power', powerAvg);

    if (!this.hasCapability('measure_power.delivery')) await this.addCapability('measure_power.delivery');
    var powerD = meta['electricity_last_measured_delivery_value'];
    this.setCapabilityValue('measure_power.delivery', powerD);

    if (!this.hasCapability('measure_power.production')) await this.addCapability('measure_power.production');
    var powerP = meta['electricity_last_measured_production_value'];
    this.setCapabilityValue('measure_power.production', powerP);

    if (this.validResult(meta['electricity_last_measured_at'])) {
      if (!this.hasCapability('lastmeasured')) await this.addCapability('lastmeasured');
      var date = meta['electricity_last_measured_at'].substring(0, 19);
      this.setCapabilityValue('lastmeasured', date);
    }

    if (this.validResult(meta['electricity_last_measured_production_at'])) {
      if (!this.hasCapability('lastmeasured_production')) await this.addCapability('lastmeasured_production');
      var date = meta['electricity_last_measured_production_at'].substring(0, 19);
      this.setCapabilityValue('lastmeasured_production', date);
    }
  }

  async syncDevice(metaData: any, zonneplanApi: ZonneplanApi) {
    const unitID = this.getData().id;
    this.log(`ID: ${unitID}`);

    const conn = zonneplanApi.getConnectionData(metaData, unitID);
    const meta = zonneplanApi.getContractData(metaData, unitID);

    if (meta) {
      this.setValues(meta);
    }

    if (meta.gas_meter_code) {
      let respGas = await zonneplanApi.getGas(conn);
      if (respGas !== undefined && respGas.data !== undefined) {
        this.log(respGas.data.measurement_groups);

        if (!this.hasCapability('meter_gas.daily')) await this.addCapability('meter_gas.daily');
        var gasDaily = respGas.data.measurement_groups[0].total / 1000;
        this.setCapabilityValue('meter_gas.daily', gasDaily);

        if (!this.hasCapability('meter_gas.daily_price')) await this.addCapability('meter_gas.daily_price');
        var priceDaily = respGas.data.measurement_groups[0].meta.delivery_costs_incl_tax / 10000000;
        this.setCapabilityValue('meter_gas.daily_price', priceDaily);

        if (!this.hasCapability('meter_gas.monthly')) await this.addCapability('meter_gas.monthly');
        var gasMonthly = respGas.data.measurement_groups[1].total / 1000;
        this.setCapabilityValue('meter_gas.monthly', gasMonthly);

        if (!this.hasCapability('meter_gas.monthly_price')) await this.addCapability('meter_gas.monthly_price');
        var priceMonthly = respGas.data.measurement_groups[1].meta.delivery_costs_incl_tax / 10000000;
        this.setCapabilityValue('meter_gas.monthly_price', priceMonthly);

        if (this.validResult(respGas.data.measurement_groups[2].total)) {
          if (!this.hasCapability('meter_gas.yearly')) await this.addCapability('meter_gas.yearly');
          if (!this.hasCapability('meter_gas')) await this.addCapability('meter_gas');
          var gas = respGas.data.measurement_groups[2].total / 1000;
          this.setCapabilityValue('meter_gas.yearly', gas);
          this.setCapabilityValue('meter_gas', gas);
        }

        if (this.validResult(respGas.data.measurement_groups[2].meta.delivery_costs_incl_tax)) {
          if (!this.hasCapability('meter_gas.yearly_price')) await this.addCapability('meter_gas.yearly_price');
          var price = respGas.data.measurement_groups[2].meta.delivery_costs_incl_tax / 10000000;
          this.setCapabilityValue('meter_gas.yearly_price', price);
        }
      }
    } else {
      if (this.hasCapability('meter_gas')) await this.removeCapability('meter_gas');
      if (this.hasCapability('meter_gas.daily')) await this.removeCapability('meter_gas.daily');
      if (this.hasCapability('meter_gas.daily_price')) await this.removeCapability('meter_gas.daily_price');
      if (this.hasCapability('meter_gas.monthly')) await this.removeCapability('meter_gas.monthly');
      if (this.hasCapability('meter_gas.monthly_price')) await this.removeCapability('meter_gas.monthly_price');
      if (this.hasCapability('meter_gas.yearly')) await this.removeCapability('meter_gas.yearly');
      if (this.hasCapability('meter_gas.yearly_price')) await this.removeCapability('meter_gas.yearly_price');
    }

    let respElec = await zonneplanApi.getElec(conn);
    if (respElec !== undefined && respElec.data !== undefined) {
      if (!this.hasCapability('meter_power.daily_delivery')) await this.addCapability('meter_power.daily_delivery');
      var prod = respElec.data.measurement_groups[1].totals.d / 1000;
      this.setCapabilityValue('meter_power.daily_delivery', prod);

      if (!this.hasCapability('meter_power.daily_production')) await this.addCapability('meter_power.daily_production');
      var prod2 = respElec.data.measurement_groups[1].totals.p / 1000;
      this.setCapabilityValue('meter_power.daily_production', prod2);

      if (!this.hasCapability('meter_power.daily')) await this.addCapability('meter_power.daily');
      var delivery = respElec.data.measurement_groups[1].totals.d / 1000;
      var prod3 = respElec.data.measurement_groups[1].totals.p / 1000;
      this.setCapabilityValue('meter_power.daily', delivery - prod3);

      if (!this.hasCapability('meter_power.daily_delivery_cost')) await this.addCapability('meter_power.daily_delivery_cost');
      var cost = respElec.data.measurement_groups[1].meta.delivery_costs_incl_tax / 10000000;
      this.setCapabilityValue('meter_power.daily_delivery_cost', cost);

      if (!this.hasCapability('meter_power.daily_production_cost')) await this.addCapability('meter_power.daily_production_cost');
      var cost2 = respElec.data.measurement_groups[1].meta.production_costs_incl_tax / 10000000;
      this.setCapabilityValue('meter_power.daily_production_cost', cost2);

      if (!this.hasCapability('meter_power.daily_cost')) await this.addCapability('meter_power.daily_cost');
      var cost4 = respElec.data.measurement_groups[1].meta.delivery_costs_incl_tax / 10000000;
      var cost42 = respElec.data.measurement_groups[1].meta.production_costs_incl_tax / 10000000;
      this.setCapabilityValue('meter_power.daily_cost', cost4 - cost42);

      if (this.validResult(respElec.data.measurement_groups[2].totals.d)) {
        if (!this.hasCapability('meter_power.monthly_delivery')) await this.addCapability('meter_power.monthly_delivery');
        var prod = respElec.data.measurement_groups[2].totals.d / 1000;
        this.setCapabilityValue('meter_power.monthly_delivery', prod);
      }

      if (this.validResult(respElec.data.measurement_groups[2].totals.p)) {
        if (!this.hasCapability('meter_power.monthly_production')) await this.addCapability('meter_power.monthly_production');
        var prod = respElec.data.measurement_groups[2].totals.p / 1000;
        this.setCapabilityValue('meter_power.monthly_production', prod);
      }

      if (!this.hasCapability('meter_power.monthly')) await this.addCapability('meter_power.monthly');
      var delivery = respElec.data.measurement_groups[2].totals.d / 1000;
      var prod = respElec.data.measurement_groups[2].totals.p / 1000;
      this.setCapabilityValue('meter_power.monthly', delivery - prod);

      if (this.validResult(respElec.data.measurement_groups[2].meta.delivery_costs_incl_tax)) {
        if (!this.hasCapability('meter_power.monthly_delivery_cost')) await this.addCapability('meter_power.monthly_delivery_cost');
        var cost = respElec.data.measurement_groups[2].meta.delivery_costs_incl_tax / 10000000;
        this.setCapabilityValue('meter_power.monthly_delivery_cost', cost);
      }

      if (this.validResult(respElec.data.measurement_groups[2].meta.production_costs_incl_tax)) {
        if (!this.hasCapability('meter_power.monthly_production_cost')) await this.addCapability('meter_power.monthly_production_cost');
        var cost = respElec.data.measurement_groups[2].meta.production_costs_incl_tax / 10000000;
        this.setCapabilityValue('meter_power.monthly_production_cost', cost);
      }

      if (!this.hasCapability('meter_power.monthly_cost')) await this.addCapability('meter_power.monthly_cost');
      var cost = respElec.data.measurement_groups[2].meta.delivery_costs_incl_tax / 10000000;
      var cost2 = respElec.data.measurement_groups[2].meta.production_costs_incl_tax / 10000000;
      this.setCapabilityValue('meter_power.monthly_cost', cost - cost2);

      if (this.validResult(respElec.data.measurement_groups[3].totals.d)) {
        if (!this.hasCapability('meter_power.yearly_delivery')) await this.addCapability('meter_power.yearly_delivery');
        var prod = respElec.data.measurement_groups[3].totals.d / 1000;
        this.setCapabilityValue('meter_power.yearly_delivery', prod);
      }

      if (this.validResult(respElec.data.measurement_groups[3].totals.p)) {
        if (!this.hasCapability('meter_power.yearly_production')) await this.addCapability('meter_power.yearly_production');
        var prod = respElec.data.measurement_groups[3].totals.p / 1000;
        this.setCapabilityValue('meter_power.yearly_production', prod);
      }

      if (!this.hasCapability('meter_power.yearly')) await this.addCapability('meter_power.yearly');
      var delivery = respElec.data.measurement_groups[3].totals.d / 1000;
      var prod = respElec.data.measurement_groups[3].totals.p / 1000;
      this.setCapabilityValue('meter_power.yearly', delivery - prod);

      if (this.validResult(respElec.data.measurement_groups[3].meta.delivery_costs_incl_tax)) {
        if (!this.hasCapability('meter_power.yearly_delivery_cost')) await this.addCapability('meter_power.yearly_delivery_cost');
        var cost = respElec.data.measurement_groups[3].meta.delivery_costs_incl_tax / 10000000;
        this.setCapabilityValue('meter_power.yearly_delivery_cost', cost);
      }

      if (this.validResult(respElec.data.measurement_groups[3].meta.production_costs_incl_tax)) {
        if (!this.hasCapability('meter_power.yearly_production_cost')) await this.addCapability('meter_power.yearly_production_cost');
        var cost = respElec.data.measurement_groups[3].meta.production_costs_incl_tax / 10000000;
        this.setCapabilityValue('meter_power.yearly_production_cost', cost);
      }

      if (!this.hasCapability('meter_power.yearly_cost')) await this.addCapability('meter_power.yearly_cost');
      var cost = respElec.data.measurement_groups[3].meta.delivery_costs_incl_tax / 10000000;
      var cost2 = respElec.data.measurement_groups[3].meta.production_costs_incl_tax / 10000000;
      this.setCapabilityValue('meter_power.yearly_cost', cost - cost2);
    }
  }
};
