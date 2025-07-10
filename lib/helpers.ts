'use strict';

import https from 'https';
import { HttpsPromiseOptions, HttpsPromiseResponse } from '../types/localTypes';

export function formatDateTime(clock: any, dateString: string) {
  const date = new Date(dateString);

  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: clock.getTimezone(),
  } as Intl.DateTimeFormatOptions;

  return new Intl.DateTimeFormat('nl-NL', options).format(date).replace(',', '');
}

export async function httpsPromise(options: HttpsPromiseOptions): Promise<HttpsPromiseResponse> {
  const { body, ...requestOptions } = options;

  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions, (res) => {
      const chunks: Uint8Array[] = [];
      res.on('data', (data: Uint8Array) => chunks.push(data));
      res.on('end', () => {
        if (res.statusCode && res.statusCode !== 200) {
          reject(new Error(`Request failed with status ${res.statusCode}`));
          return;
        }

        let resBody = Buffer.concat(chunks).toString();
        switch (res.headers['content-type']) {
          case 'application/json':
            try {
              resBody = JSON.parse(resBody);
            } catch (error) {
              reject(new Error(`Exception parsing JSON: ${error}`));
              return;
            }
            break;
          default:
            try {
              resBody = JSON.parse(resBody);
            } catch (error) {
              resBody = resBody.toString();
            }
            break;
        }

        resolve({ body: resBody, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}
