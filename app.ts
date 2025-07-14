'use strict';

import Homey from 'homey';
import { ZonneplanApi } from './lib/ZonneplanApi';

const refreshInterval = 60 * 5000; // 5 minutes

module.exports = class MyZonneplanApp extends Homey.App {
  #zonneplanApi!: ZonneplanApi;

  async onInit() {
    this.log('MyZonneplanApp has been initialized');

    const accessToken = this.homey.settings.get('access_token');
    const refreshToken = this.homey.settings.get('refresh_token');

    this.#zonneplanApi = new ZonneplanApi(this.homey.log, accessToken, refreshToken);

    this.homey.setInterval(() => {
      this.refreshDevices();
    }, refreshInterval);

    this.refreshDevices();
  }

  async activate(email: string) {
    var result = this.#zonneplanApi.activate(email);
    this.refreshDevices();
    return result;
  }

  async getOTP(uuid: string) {
    return this.#zonneplanApi.getOTP(uuid);
  }

  async getToken(email: string, password: string) {
    return this.#zonneplanApi.getToken(email, password);
  }

  async refreshDevices() {
    // Refresh the basic data from the Zonneplan API (with retry mechanism to refresh access token if needed)
    let resp = await this.#zonneplanApi.getDevice();

    if (resp == 'Unauthenticated.') {
      const res = await this.#zonneplanApi.getRefreshToken();

      this.log('Log from getting refresh token');
      this.homey.settings.set('access_token', res.access_token);
      this.homey.settings.set('refresh_token', res.refresh_token);

      resp = await this.#zonneplanApi.getDevice();
    }

    if (resp === undefined || resp.data === undefined || resp.data.address_groups === undefined) {
      this.log('Error while refreshing devices: ' + resp);
      return;
    }

    const drivers = Object.values(this.homey.drivers.getDrivers());
    drivers.forEach((driver: any) => {
      const devices = driver.getDevices();
      devices.forEach(async (device: any) => {
        if (device instanceof Error) {
          this.log('Error while refreshing device: ' + device);
          return;
        }

        // Call the synchronize function from the device
        try {
          await device.syncDevice(resp.data.address_groups, this.#zonneplanApi);
        } catch (error) {
          this.log('Error while synchronizing device: ' + error);
        }
      });
    });
  }
};
