'use strict';

module.exports = {
  async postActivate({ homey, body={}}) {
    console.log('in api.js what we have ')
    await homey.app.activate(body.email);
  }

};