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

    if (this.hasCapability('meter_gas.daily') === false) {
      await this.addCapability('meter_gas.daily');
    }
    if (this.hasCapability('meter_gas.daily_price') === false) {
      await this.addCapability('meter_gas.daily_price');
    }
    if (this.hasCapability('meter_gas.monthly') === false) {
      await this.addCapability('meter_gas.monthly');
    }
    if (this.hasCapability('meter_gas.monthly_price') === false) {
      await this.addCapability('meter_gas.monthly_price');
    }
    if (this.hasCapability('meter_gas.yearly') === false) {
      await this.addCapability('meter_gas.yearly');
    }
    if (this.hasCapability('meter_gas.yearly_price') === false) {
      await this.addCapability('meter_gas.yearly_price');
    }    

    this.pollP1();

    timer = this.homey.setInterval(() => {
      // poll device state from p1
      this.pollP1();
    }, RETRY_INTERVAL);



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
    if (resp !== undefined && resp.data !== undefined && Object.hasOwn(resp.data, 'address_groups')) {

      const meta = getContractData(resp.data.address_groups, unitID)
      console.log("meta data ", meta)
      if (meta) {
        this.setValues(meta)
      }
      const conn = getConnectionData(resp.data.address_groups, unitID)
      console.log("conn data ", conn)
      let respGas = await apis.getGas(accessToken, conn)
      if (respGas !== undefined && respGas.data !== undefined) {
        console.log("gas day m3 ",  respGas.data.measurement_groups[0].total/1000)
        console.log("gas day price ",  respGas.data.measurement_groups[0].meta.delivery_costs_incl_tax/10000000)
        console.log("gas month m3 ",  respGas.data.measurement_groups[1].total/1000)
        console.log("gas month price ",  respGas.data.measurement_groups[1].meta.delivery_costs_incl_tax/10000000)
        console.log("gas year m3 ",  respGas.data.measurement_groups[2].total/1000)
        console.log("gas year price ", respGas.data.measurement_groups[2].meta.delivery_costs_incl_tax/10000000)
        if (this.validResult(respGas.data.measurement_groups[0].total)) {
          this.addCapability('meter_gas.daily');
          var gas = respGas.data.measurement_groups[0].total/1000;
          this.setCapabilityValue('meter_gas.daily', gas);
        }
        if (this.validResult(respGas.data.measurement_groups[0].meta.delivery_costs_incl_tax)) {
          this.addCapability('meter_gas.daily_price');
          var price =  respGas.data.measurement_groups[0].meta.delivery_costs_incl_tax/10000000;
          this.setCapabilityValue('meter_gas.daily_price', price);
        }
        if (this.validResult(respGas.data.measurement_groups[1].total)) {
          this.addCapability('meter_gas.monthly');
          var gas = respGas.data.measurement_groups[1].total/1000;
          this.setCapabilityValue('meter_gas.monthly', gas);
        }
        if (this.validResult(respGas.data.measurement_groups[1].meta.delivery_costs_incl_tax)) {
          this.addCapability('meter_gas.monthly_price');
          var price =  respGas.data.measurement_groups[1].meta.delivery_costs_incl_tax/10000000;
          this.setCapabilityValue('meter_gas.monthly_price', price);
        }
        if (this.validResult(respGas.data.measurement_groups[2].total)) {
          this.addCapability('meter_gas.yearly');
          var gas = respGas.data.measurement_groups[2].total/1000;
          this.setCapabilityValue('meter_gas.yearly', gas);
        }
        if (this.validResult(respGas.data.measurement_groups[2].meta.delivery_costs_incl_tax)) {
          this.addCapability('meter_gas.yearly_price');
          var price =  respGas.data.measurement_groups[2].meta.delivery_costs_incl_tax/10000000;
          this.setCapabilityValue('meter_gas.yearly_price', price);
        }                
      }
      let respElec = await apis.getElec(accessToken, conn)
      if (respElec !== undefined && respElec.data !== undefined) {

        console.log("elec day kwh ",  respElec.data.measurement_groups[1].totals.d/1000)
        console.log("elec day production kwh ",  respElec.data.measurement_groups[1].totals.p/1000)
        console.log("elec day price ",  respElec.data.measurement_groups[1].meta.delivery_costs_incl_tax/10000000)
        console.log("elec day production price ",  respElec.data.measurement_groups[1].meta.production_costs_incl_tax/10000000)

        console.log("elec month kwh ",  respElec.data.measurement_groups[2].totals.d/1000)
        console.log("elec month production kwh ",  respElec.data.measurement_groups[2].totals.p/1000)        
        console.log("elec month price ",  respElec.data.measurement_groups[2].meta.delivery_costs_incl_tax/10000000)
        console.log("elec month production price ",  respElec.data.measurement_groups[2].meta.production_costs_incl_tax/10000000)

        console.log("elec year kwh ",  respElec.data.measurement_groups[3].totals.d/1000)
        console.log("elec year production kwh ",  respElec.data.measurement_groups[3].totals.p/1000)        
        console.log("elec year price ", respElec.data.measurement_groups[3].meta.delivery_costs_incl_tax/10000000)
        console.log("elec year production price ", respElec.data.measurement_groups[3].meta.production_costs_incl_tax/10000000)
        // console.log("elec data ", respElec.measurement_groups[0].total)


          // key="electricity_data.measurement_groups.0.totals.d",

          // key="electricity_data.measurement_groups.0.totals.p",

          // key="electricity_data.measurement_groups.0.meta.delivery_costs_incl_tax",

          // key="electricity_data.measurement_groups.0.meta.production_costs_incl_tax",


      }
    }
  }
}

function getContractData(arrayOfGroups, id) {
  console.log('contract ', id);

  const filteredData = arrayOfGroups.map((element) => {
    return {
      connections: element.connections.map((connection) => {
        console.log('address uuid', connection.uuid)
        return { contracts: connection.contracts.find((contract) => contract.uuid == id) }
      }
      )
    }
  })
  for (var i = 0; i < filteredData.length; i++) {

    // console.log('List of contract ', filteredData[i].connections);
    for (var a = 0; a < filteredData[i].connections.length; a++) {
      if (filteredData[i].connections[a].contracts) {
        // console.log('contract ', filteredData[i].connections[a]);
        // console.log('List of contract ', filteredData[i].connections[a].contracts.meta);
        return filteredData[i].connections[a].contracts.meta
      }
    }
  }
}


function getConnectionData(arrayOfGroups, id) {
  console.log('contract ', id);
  // console.log('List of contract ', arrayOfGroups);
  for (var i = 0; i < arrayOfGroups.length; i++) {
    for (var a = 0; a < arrayOfGroups[i].connections.length; a++) {
      // console.log('List of conn ', arrayOfGroups[i].connections[a]);
      if (arrayOfGroups[i].connections[a].contracts) {
        for (var n = 0; n < arrayOfGroups[i].connections[a].contracts.length; n++) {
        // console.log('contract uudi ', arrayOfGroups[i].connections[a].contracts[n]);
        if (arrayOfGroups[i].connections[a].contracts[n].uuid == id) {
          console.log('connection uudi ', arrayOfGroups[i].connections[a].uuid);
          return arrayOfGroups[i].connections[a].uuid
        }
      }
      }
    }
  }
}
