'use strict';

import Homey from 'homey/lib/Homey';

export interface MyZonneplanApp extends Homey.App {
  activate: (email: string) => Promise<void>;
  getOTP: (uuid: string) => Promise<void>;
  getToken: (email: string, password: string) => Promise<void>;
}

export interface DeviceDefinition {
  name: string;
  data: {
    id: string;
    name: string;
  };
}
