'use strict';

const Homey = require('homey');

module.exports = class SolarplanDevice extends Homey.Device {

  async onInit() {
    this.log('SolarplanDevice has been inited');
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

} // end onDeleted


}