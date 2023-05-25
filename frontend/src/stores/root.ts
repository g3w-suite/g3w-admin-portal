import config from '@/config';
import { sameOrigin } from '@/utils';

import { defineStore } from 'pinia'

// TODO: write some tests ...
const refresh_token = false; // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTY4MDY4MTYyNSwiaWF0IjoxNjgwNTk1MjI1LCJqdGkiOiJlZTBlMzUwNTdlNzM0YWU3YjBkODViZjFmZjNhM2RhMSIsInVzZXJfaWQiOjJ9.pDWo9Ei5f1ZMpjGmG2Um2V_xiCTaCMxzqkbNzVeFOvE" ;

interface IRootState {
  isLoading: boolean;
  crossOrigin: boolean;
  access_token: string | null;
  refresh_token: string | null;
  useCookies: boolean;
}

export const useRootStore = defineStore('root', {

  state: (): IRootState => ({
    isLoading: false,
    access_token: refresh_token || localStorage.getItem('access_token') || '',
    refresh_token: refresh_token || localStorage.getItem('refresh_token') || '',
    crossOrigin: !sameOrigin((window as any).location, config.api_base_url),
    useCookies: !['Bearer', 'JWT'].includes(config.auth_mode),
  }),

  actions: {

    showLoader() {
      this.isLoading = true;
    },

    hideLoader() {
      this.isLoading = false;
    },

    setTokens(newToken: { access: string, refresh: string }) {
      this.setLocalStorage('access_token', newToken.access );
      this.setLocalStorage('refresh_token', newToken.refresh);
    },

    removeTokens() {
      this.setLocalStorage('access_token');
      this.setLocalStorage('refresh_token');
    },

    setLocalStorage(id: 'access_token'| 'refresh_token', value?: string | null) {
      // TODO: for security purposes, take localStorage out of the project
      if (value) {
        localStorage.setItem(id, value);
      } else {
        localStorage.removeItem(id);
      }
      this[id] = value;
    },

  }

})