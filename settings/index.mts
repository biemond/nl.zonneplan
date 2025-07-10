'use strict';

import type HomeySettings from 'homey/lib/HomeySettings.js';

class SettingScript {
  private homey: HomeySettings;
  private uuid: string | undefined;

  constructor(homey: HomeySettings) {
    this.homey = homey;
  }

  public async onHomeyReady(): Promise<void> {
    var activateElement = document.getElementById('activate');
    var saveElement = document.getElementById('save');

    this.homey.get('email', (err: string, email: string) => {
      if (err) return this.homey.alert(err);
      this.setInputValue('email', email);
    });

    activateElement?.addEventListener('click', (e: any) => {
      console.log('onHomeyReady activateElement click ');
      this.#activateEmail();

      const emailValue = this.getInputValue('email');

      this.homey.set('email', emailValue, (err: string) => {
        if (err) return this.homey.alert(err);
      });
    });

    saveElement?.addEventListener('click', (e: any) => {
      console.log('onHomeyReady save click');
      this.#save();
    });

    this.homey.ready();
  }

  async #activateEmail() {
    const emailValue = this.getInputValue('email');
    this.homey.api('POST', '/', { email: emailValue }, (err: string, success: any) => {
      if (err) {
        console.log('error ', err);
        this.homey.alert('Email you have entered is not registered.');
      }
      if (!err && success) {
        console.log('success', success.data.uuid);
        this.uuid = success.data.uuid;

        const message = `We send an activation email to ${emailValue}, please activate and then click Finish activation to get OTP.`;
        this.homey.alert(message);

        var saveElement = document.getElementById('save');
        saveElement!.removeAttribute('disabled');
      }
    });
  }

  async #save() {
    console.log('uuid in save html', this.uuid);

    this.homey.api('GET', `/otp/${this.uuid}`, (err: string, success: any) => {
      if (err) {
        console.log('error ', err);
      }
      if (!err && success) {
        const otpObject = success.data;
        console.log('otpObject values ', otpObject);

        this.homey.set('email', otpObject.email, (err: string) => {
          if (err) return this.homey.alert(err);
        });

        this.homey.set('password', otpObject.password, (err: string) => {
          if (err) return this.homey.alert(err);
        });

        this.#getToken(otpObject.email, otpObject.password);
        this.homey.alert('All is ok, please add the zonneplan device');
      }
    });
  }

  async #getToken(email: string, password: string) {
    this.homey.api('POST', '/token', { email: email, password: password }, (err: string, success: any) => {
      if (err) {
        console.log('error ', err);
        this.homey.alert('Problem with retrieving token');
      }
      if (!err && success) {
        console.log('success', success);
        this.homey.set('access_token', success.access_token, (err: string) => {
          if (err) return this.homey.alert(err);
        });

        this.homey.set('refresh_token', success.refresh_token, (err: string) => {
          if (err) return this.homey.alert(err);
        });
      }
    });
  }

  setInputValue(id: string, value: string | number | undefined) {
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) {
      input.value = value?.toString() || '';
    }
  }

  getInputValue(id: string) {
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) {
      return input.value;
    }

    return null;
  }
}

window.onHomeyReady = async (homey: any): Promise<void> => await new SettingScript(homey).onHomeyReady();
