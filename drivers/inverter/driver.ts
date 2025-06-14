'use strict';

import PairSession from 'homey/lib/PairSession';
import { ZonneplanApi } from '../../lib/ZonneplanApi';
import Homey from 'homey';

module.exports = class SolarplanDriver extends Homey.Driver {
  async onInit() {}

  async onPair(session: PairSession) {
    const accessToken = this.homey.settings.get('access_token');
    const refreshToken = this.homey.settings.get('refresh_token');
    var zonneplanApi = new ZonneplanApi(this.homey.log, accessToken, refreshToken);

    session.setHandler('list_devices', async () => {
      if (accessToken == null || refreshToken == null) {
        throw Error('Please activate tokens!');
      }

      const resp = await zonneplanApi.getDevice();
      this.log(resp.message);

      if (resp.message === 'Unauthenticated.') {
        throw new Error('Please activate tokens!');
      }

      let dataObject = await zonneplanApi.getContractUUID(resp.data.address_groups, 'pv_installation');
      return zonneplanApi.getDevices(dataObject);
    });
  }
};
