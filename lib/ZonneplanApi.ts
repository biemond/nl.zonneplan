import { DeviceDefinition } from '../types/localTypes';
import { httpsPromise } from './helpers';

const zonneplanApiBase = 'app-api.zonneplan.nl';

export class ZonneplanApi {
  #log: (...args: any[]) => void;
  #token: string;
  #refreshToken: string;

  constructor(logger: (...args: any[]) => void, token: string, refreshToken: string) {
    this.#log = logger || console.log;
    this.#token = token;
    this.#refreshToken = refreshToken;
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-app-version': '2.1.1',
      Authorization: `Bearer ${this.#token}`,
      'User-Agent': 'Homey-Zonneplan/1.1.1',
    };
  }

  async getDevice() {
    const res = await httpsPromise({
      hostname: zonneplanApiBase,
      path: '/user-accounts/me',
      method: 'GET',
      headers: this.getHeaders(),
      family: 4,
    });

    return <any>res.body;
  }

  async getGas(uuid: string) {
    this.#log('making gas call to get device');

    const res = await httpsPromise({
      hostname: zonneplanApiBase,
      path: `/connections/${uuid}/gas`,
      method: 'GET',
      headers: this.getHeaders(),
      family: 4,
    });

    return <any>res.body;
  }

  async getElec(uuid: string) {
    this.#log('making elec call to get device');

    const res = await httpsPromise({
      hostname: zonneplanApiBase,
      path: `/connections/${uuid}/electricity-delivered`,
      method: 'GET',
      headers: this.getHeaders(),
      family: 4,
    });

    return <any>res.body;
  }

  async getBatteryUsageData(uuid: string) {
    this.#log('UUID value', uuid);

    const res = await httpsPromise({
      hostname: zonneplanApiBase,
      path: `/contracts/${uuid}/home_battery_installation/charts/days_cumulative?date=2024-01-01`,
      method: 'GET',
      headers: this.getHeaders(),
      family: 4,
    });

    this.#log('Battery usage data response (1): ', res.body);
    return <any>res.body;
  }

  async getBatteryUsageData2(uuid: string, battUuid: string) {
    this.#log('UUID value', uuid);
    this.#log('Battery UUID value', battUuid);

    const res = await httpsPromise({
      hostname: zonneplanApiBase,
      path: `/connections/${uuid}/home-battery-installation/${battUuid}`,
      method: 'GET',
      headers: this.getHeaders(),
      family: 4,
    });

    this.#log('Battery usage data response (2): ', res.body);
    return <any>res.body;
  }

  async getToken(email: string, password: string) {
    this.#log('Making call to get new token.');

    const res = await httpsPromise({
      hostname: zonneplanApiBase,
      path: `/oauth/token`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      referrerPolicy: 'no-referrer',
      credentials: 'include',
      body: JSON.stringify({
        email,
        password,
        grant_type: 'one_time_password',
      }),
      family: 4,
    });

    const resp = <any>res.body;

    this.#log('GetToken response: ', resp);

    // Write token to local storage
    this.#refreshToken = resp.refresh_token;
    this.#token = resp.access_token;

    return <any>resp;
  }

  async getOTP(uuid: string) {
    this.#log('UUID value', uuid);

    const res = await httpsPromise({
      hostname: zonneplanApiBase,
      path: `/auth/request/${uuid}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      referrerPolicy: 'no-referrer',
      credentials: 'include',
      family: 4,
    });

    this.#log('OTP response: ', res.body);

    return <any>res.body;
  }

  async activate(email: string) {
    this.#log('Email value', email);

    try {
      const res = await httpsPromise({
        hostname: zonneplanApiBase,
        path: `/auth/request/`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        referrerPolicy: 'no-referrer',
        credentials: 'include',
        body: JSON.stringify({ email }),
        family: 4,
      });

      this.#log('Activate response: ', res.body);

      return <any>res.body;
    } catch (error) {
      this.#log('Error during activation: ', error);
    }

    return null;
  }

  async getRefreshToken() {
    const res = await httpsPromise({
      hostname: zonneplanApiBase,
      path: `/oauth/token`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: this.#refreshToken, grant_type: 'refresh_token' }),
      family: 4,
    });

    const resp = <any>res.body;

    this.#log('Get refresh token response: ', resp);

    // Write token to local storage
    this.#refreshToken = resp.refresh_token;
    this.#token = resp.access_token;

    return resp;
  }

  async getDevices(dataObject: any): Promise<DeviceDefinition[]> {
    let devices = [];

    this.#log('Length ', dataObject.length);
    for (var i = 0; i < dataObject.length; i++) {
      this.#log('List of driver ', dataObject[i]);
      this.#log('Length ', dataObject[i].connections.length);
      for (var a = 0; a < dataObject[i].connections.length; a++) {
        for (var contr = 0; contr < dataObject[i].connections[a].contracts.length; contr++) {
          this.#log('List of driver device ', dataObject[i].connections[a].contracts[contr]);
          var device = {
            name: dataObject[i].connections[a].contracts[contr].label,
            data: {
              id: dataObject[i].connections[a].contracts[contr].uuid,
              name: dataObject[i].connections[a].contracts[contr].label,
            },
          };

          devices.push(device);
        }
      }
    }

    this.#log('List of driver devices ', devices);
    return devices;
  }

  async getContractUUID(arrayOfGroups: any, contractType: string) {
    const filteredData = arrayOfGroups.map((element: any) => {
      return {
        connections: element.connections.map((connection: any) => {
          return { contracts: connection.contracts.filter((contract: any) => contract.type == contractType) };
        }),
      };
    });

    this.#log('List of devices:', filteredData);
    return filteredData;
  }

  getContractData(arrayOfGroups: any, id: string) {
    this.#log('Contract: ', id);
    // this.log('Full API Results: ', JSON.stringify(arrayOfGroups[0].connections, null, 2));

    const filteredData = arrayOfGroups.map((element: any) => {
      return {
        connections: element.connections.map((connection: any) => {
          return { contracts: connection.contracts.find((contract: any) => contract.uuid === id) };
        }),
      };
    });

    for (let i = 0; i < filteredData.length; i++) {
      for (let a = 0; a < filteredData[i].connections.length; a++) {
        if (filteredData[i].connections[a].contracts) {
          return filteredData[i].connections[a].contracts.meta;
        }
      }
    }

    return null;
  }

  getConnectionData(arrayOfGroups: any, id: string) {
    this.#log('contract ', id);

    for (let i = 0; i < arrayOfGroups.length; i++) {
      for (let a = 0; a < arrayOfGroups[i].connections.length; a++) {
        // this.#log('List of conn ', arrayOfGroups[i].connections[a]);
        if (arrayOfGroups[i].connections[a].contracts) {
          for (let n = 0; n < arrayOfGroups[i].connections[a].contracts.length; n++) {
            // this.#log('contract uudi ', arrayOfGroups[i].connections[a].contracts[n]);
            if (arrayOfGroups[i].connections[a].contracts[n].uuid === id) {
              this.#log('connection uudi ', arrayOfGroups[i].connections[a].uuid);
              return arrayOfGroups[i].connections[a].uuid;
            }
          }
        }
      }
    }

    return null;
  }
}
