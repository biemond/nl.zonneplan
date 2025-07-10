'use strict';

import Homey from 'homey/lib/Homey';
import https from 'https';
import { IncomingHttpHeaders } from 'http';

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

export interface HttpsPromiseOptions {
  body?: string | Buffer;
  hostname: string;
  path: string;
  method: string;
  headers?: { [key: string]: string | string[] | number };
  agent?: https.Agent;
  rejectUnauthorized?: boolean; // Optional for SSL/TLS validation
  family?: number; // Optional for IP address family
  referrerPolicy?: string; // Optional for referrer policy
  credentials?: 'include' | 'omit' | 'same-origin'; // Optional for credentials
}

export interface HttpsPromiseResponse {
  body: string | object;
  headers: IncomingHttpHeaders;
}
