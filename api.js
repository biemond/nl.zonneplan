'use strict';

module.exports = {
  async postActivate({ homey, body={}}) {
    return await  homey.app.activate(body.email);
  },

  async getOTP({ homey, params }) {
    console.log('in api.js what we have getOTP ', params)
    return await  homey.app.getOTP(params.uuid );
  }

};