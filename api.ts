"use strict";

import { MyZonneplanApp } from "./types/localTypes";

module.exports = {
  async postActivate({ homey, body = {} }: { homey: any; body: any }) {
    const app = <MyZonneplanApp>homey.app;

    return await app.activate(body.email);
  },

  async getOTP({ homey, params }: { homey: any; params: any }) {
    const app = <MyZonneplanApp>homey.app;

    console.log("in api.js what we have getOTP ", params);
    return await app.getOTP(params.uuid);
  },

  async postToken({ homey, body = {} }: { homey: any; body: any }) {
    const app = <MyZonneplanApp>homey.app;

    return await app.getToken(body.email, body.password);
  },
};
