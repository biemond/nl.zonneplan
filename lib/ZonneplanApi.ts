import { DeviceDefinition } from '../types/localTypes';

const zonneplayApiBase = 'https://app-api.zonneplan.nl';

export class ZonneplanApi {
  #log: (...args: any[]) => void;
  #token: string;
  #refreshToken: string;

  constructor(logger: (...args: any[]) => void, token: string, refreshToken: string) {
    this.#log = logger || console.log;
    this.#token = token;
    this.#refreshToken = refreshToken;
  }

  async getDevice() {
    const url = `${zonneplayApiBase}/user-accounts/me`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-app-version': '2.1.1', Authorization: `Bearer ${this.#token}` },
    });

    const resp = await res.json();
    return resp;
  }

  async getGas(uuid: string) {
    const url = `${zonneplayApiBase}/connections/${uuid}/gas`;
    this.#log('making gas call to get device');
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-app-version': '2.1.1', Authorization: `Bearer ${this.#token}` },
    });
    const resp = await res.json();
    return resp;
  }

  async getElec(uuid: string) {
    const url = `${zonneplayApiBase}/connections/${uuid}/electricity-delivered`;
    this.#log('making elec call to get device');
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-app-version': '2.1.1', Authorization: `Bearer ${this.#token}` },
    });
    const resp = await res.json();
    return resp;
  }

  async getBatteryUsageData(uuid: string) {
    this.#log('UUID value', uuid);

    const url = `${zonneplayApiBase}/contracts/${uuid}/home_battery_installation/charts/days_cumulative?date=2024-01-01`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-app-version': '2.1.1', Authorization: `Bearer ${this.#token}` },
    });

    const resp = await res.json();
    this.#log('Battery usage data response (1): ', resp);
    return resp;
  }

  async getBatteryUsageData2(uuid: string, battUuid: string) {
    this.#log('UUID value', uuid);
    this.#log('Battery UUID value', battUuid);

    const url = `${zonneplayApiBase}/connections/${uuid}/home-battery-installation/${battUuid}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-app-version': '2.1.1', Authorization: `Bearer ${this.#token}` },
    });

    const resp = await res.json();
    this.#log('Battery usage data response (2): ', resp);
    return resp;
  }

  async getToken(email: string, password: string) {
    const url = `${zonneplayApiBase}/oauth/token`;
    this.#log('Making call to get new token.');

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      referrerPolicy: 'no-referrer',
      credentials: 'include',
      body: JSON.stringify({
        email,
        password,
        grant_type: 'one_time_password',
      }),
    });

    const resp = await res.json();
    this.#log("We've got the token: ", resp);

    // Write token to local storage
    this.#refreshToken = resp.refresh_token;
    this.#token = resp.access_token;

    return resp;
  }

  async getOTP(uuid: string) {
    this.#log('UUID value', uuid);

    const res = await fetch(`${zonneplayApiBase}/auth/request/${uuid}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      referrerPolicy: 'no-referrer',
      credentials: 'include',
    });

    const resp = await res.json();
    return resp;
  }

  async activate(email: string) {
    const res = await fetch(`${zonneplayApiBase}/auth/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      referrerPolicy: 'no-referrer',
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    const resp = await res.json();
    return resp;
  }

  async getRefreshToken() {
    const url = `${zonneplayApiBase}/oauth/token`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-app-version': '2.1.1' },
      body: JSON.stringify({ refresh_token: this.#refreshToken, grant_type: 'refresh_token' }),
    });

    const resp = await res.json();

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
