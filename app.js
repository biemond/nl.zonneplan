const Homey = require('homey');

class MyZonneplanApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('MyZonneplanApp has been initialized');
  }

}

module.exports = MyZonneplanApp;
