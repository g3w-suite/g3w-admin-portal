import { defineStore } from 'pinia';
import { ELoginStatus } from '@/types/ELoginStatus';
import { get_from_portal } from '@/utils';
import User from '@/types/TUser';
import { IWhoAmI } from '@/types/IWhoAmI';

import { useRootStore, useLangStore } from '@/stores';

import { httpClient as axios } from '@/utils';

interface IUserState {
  user: User | null;
  await_token_refresh: Promise<string> | null;
}

export const useAuthStore = defineStore('auth', {

  state: (): IUserState => ({
    user: null,
    await_token_refresh: null,
  }),

  getters: {
    isLoggedIn: (state): boolean => state.user != null,
  },

  actions: {

    setUser(i: User | null) {
      this.user = i;
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
      await (
        useRootStore().useCookies
          ? this._jx_login  // Cookie
          : this._jwt_login // JWT
      )(username, password);
      this.fetchWhoAmI();
    },

    /**
     * Perform logout request(s)
     */
    async logout() {
      // conditionally handle logout managers
      await Promise.all([
        useRootStore().useCookies
          ? Promise.resolve()
          : axios.post<unknown>('/authjwt/api/token/blacklist/', { refresh: useRootStore().refresh_token }), // JWT
        axios.get<{ status: ELoginStatus; message?: string; }>(useLangStore().locale + '/jx/logout/'),       // Cookie
      ]);
      this.setUser(null);
    },

    /**
     * [AUTH_JWT] Refresh an expired "access" token
     */
    refresh() {
      // prevent sending multiple token requests
      if (!this.await_token_refresh) {
        this.await_token_refresh = new Promise((resolve, reject) => {
          axios.post<{ access: string }>('/authjwt/api/token/refresh/', { refresh: useRootStore().refresh_token })
            .then((data: { access: string }) => {
              useRootStore().setTokens({ access: data.access, refresh: useRootStore().refresh_token });
              resolve(data.access);
            })
            .catch((err: unknown) => {
              useRootStore().removeTokens();
              // TODO: logout without reload application on expired or invalid refresh token
              window.location.reload();
              reject(err);
            })
            .finally(() => { this.await_token_refresh = null; });
        });
      }
      return this.await_token_refresh;
    },

    _jx_login(username: string, password: string) {
      return axios
        .post<{ status: ELoginStatus; error_form?: object; message?: string }>(
          useLangStore().locale + '/jx/login/',
          (new URLSearchParams({ username, password })).toString(),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )
        .then(data => {
          if (data.status !== ELoginStatus.OK) {
            this.setUser(null);
            throw data.error_form;
          }
        });
    },

    _jwt_login(username: string, password: string) {
      return axios
        .post<{ access: string; refresh: string }>('/authjwt/api/token/', { username, password })
        .then(data => useRootStore().setTokens({ ...data }));
    },

    /**
     * [AUTH_JWT] Heartbeat request (PING -> PONG)
     */
    _jwt_ping() {
      return axios.get<{ id: 'PONG' }>('/authjwt/api/ping/', { params: { id: 'PONG' } });
    },

  }

});