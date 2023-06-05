import config from '@/config';
import { sameOrigin } from '@/utils';
import { defineStore } from 'pinia';
import { ELoginStatus } from '@/types/ELoginStatus';
import { get_admin_url, get_from_portal } from '@/utils';
import User from '@/types/TUser';
import { IWhoAmI } from '@/types/IWhoAmI';
import { useRootStore, useDataStore } from '@/stores';
import { HTTPCLIENT as axios } from '@/utils';

// TODO: write some tests ...
const refresh_token = false; // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTY4MDY4MTYyNSwiaWF0IjoxNjgwNTk1MjI1LCJqdGkiOiJlZTBlMzUwNTdlNzM0YWU3YjBkODViZjFmZjNhM2RhMSIsInVzZXJfaWQiOjJ9.pDWo9Ei5f1ZMpjGmG2Um2V_xiCTaCMxzqkbNzVeFOvE" ;

interface IUserState {
  user: User | null;
  crossOrigin: boolean;
  access_token: string;
  refresh_token: string;
  useCookies: boolean;
  await_token_refresh: Promise<string> | null;
}

export const useAuthStore = defineStore('auth', {

  state: (): IUserState => ({
    user:                null,
    access_token:        refresh_token || localStorage.getItem('access_token') || '',
    refresh_token:       refresh_token || localStorage.getItem('refresh_token') || '',
    crossOrigin:         !sameOrigin((window as any).location, config.api_base_url),
    useCookies:          !['Bearer', 'JWT'].includes(config.auth_mode),
    await_token_refresh: null,
  }),

  getters: {
    isLoggedIn: (state): boolean => state.user != null,
  },

  actions: {

    setUser(i: User | null) {
      this.user = i;
      // fetch again data from server on user Login / Logout 
      useRootStore().fetchData(true);
    },

    setTokens(newToken: { access: string, refresh: string }) {
      this.setLocalStorage('access_token', newToken.access);
      this.setLocalStorage('refresh_token', newToken.refresh);
    },

    removeTokens() {
      this.setLocalStorage('access_token');
      this.setLocalStorage('refresh_token');
    },

    setLocalStorage(id: 'access_token' | 'refresh_token', value = '') {
      // TODO: for security purposes, take localStorage out of the project
      if (value) {
        localStorage.setItem(id, value);
      } else {
        localStorage.removeItem(id);
      }
      this[id] = value;
    },

    /**
     * Fetch user status (logged in/out)
     */
    fetchWhoAmI() {
      return get_from_portal<IWhoAmI>('/api/whoami/')
        .then((u) => { if (u.is_authenticated) { this.setUser(new User(u)); } })
        .catch((e) => { this.setUser(null); })
    },

    /**
     * Perform login request(s)
     */
    async login(username: string, password: string) {
      await (this.useCookies ? _jx_login : _jwt_login)(username, password);
      this.fetchWhoAmI();
    },

    /**
     * Perform logout request(s)
     */
    async logout() {
      await (this.useCookies ? _jx_logout : _jwt_logout)(); 
      this.setUser(null);
    },

    /**
     * Redirect to custom pages (login, logout, admin) 
     */
    maybe_redirect(to: any, from?: any, next = ()=>{}) {
      switch(to.name) {
        case 'login':
          // redirect to custom login page
          if ('login' !== useDataStore().info.login_url) {
            location.href = useDataStore().info.login_url;
            return false;
          }
          // default login
          next();
          break;
        case 'logout':
          // redirect to custom logout page
          if ('login' !== useDataStore().info.login_url) {
            location.href = useDataStore().info.logout_url;
            return false;
          }
          // default logout
          this.logout();
          next();
          break;
        case 'admin':
          // redirect to admin dashboard page
          location.href = get_admin_url(config.admin_root);
          break;
      }
    },

    /**
     * Refresh an expired session (eg: expired authjwt token)
     */
    refresh() {
      // prevent sending multiple token requests
      if (!this.await_token_refresh) {
        this.await_token_refresh = _jwt_refresh();
      }
      return this.await_token_refresh;
    },

  }

});

function _jx_login(username: string, password: string) {
  return axios
    .post<{ status: ELoginStatus; error_form?: object; message?: string }>(
      useRootStore().locale + '/jx/login/',
      (new URLSearchParams({ username, password })).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    .then(data => {
      if (data.status !== ELoginStatus.OK) {
        useAuthStore().setUser(null);
        throw data.error_form;
      }
    });
}

function _jx_logout() {
  return axios.get<{ status: ELoginStatus; message?: string; }>(useRootStore().locale + '/jx/logout/');
}

function _jwt_login(username: string, password: string) {
  return axios
    .post<{ access: string; refresh: string }>('/authjwt/api/token/', { username, password })
    .then(data => useAuthStore().setTokens({ ...data }));
}

function _jwt_logout() {
  return Promise.all([
    axios.post<unknown>('/authjwt/api/token/blacklist/', { refresh: useAuthStore().refresh_token }), // JWT
    _jx_logout()                                                                           // Cookie
  ]);
}

function _jwt_refresh() {
  return new Promise<string>((resolve, reject) => {
    axios.post<{ access: string }>('/authjwt/api/token/refresh/', { refresh: useAuthStore().refresh_token })
      .then((data: { access: string }) => {
        useAuthStore().setTokens({ access: data.access, refresh: useAuthStore().refresh_token });
        resolve(data.access);
      })
      .catch((err: unknown) => {
        useAuthStore().removeTokens();
        // TODO: logout without reload application on expired or invalid refresh token
        window.location.reload();
        reject(err);
      })
      .finally(() => { useAuthStore().await_token_refresh = null; });
  });
}

function _jwt_ping() {
  return axios.get<{ id: 'PONG' }>('/authjwt/api/ping/', { params: { id: 'PONG' } }); // heartbeat (PING -> PONG)
}