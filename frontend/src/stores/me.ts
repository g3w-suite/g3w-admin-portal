import { defineStore } from 'pinia';
import { ELoginStatus } from '@/types/ELoginStatus';
import { get_from_portal } from '@/utils';
import User from '@/types/TUser';
import { IWhoAmI } from '@/types/IWhoAmI';

import { useRootStore, useLangStore } from '@/stores';

import { httpClient as axios } from '@/utils';

// TODO: should we make this variable a `userState` property?
let refreshTokenPromise: Promise<any> | null;

/**
 * Perform logout request
 */
function jx_logout() {
  return axios.get<{
    status: ELoginStatus,
    message?: string
  }>(useLangStore().locale + '/jx/logout/');
}

/**
 * Perform login request
 */
function jx_login(username: string, password: string) {
  return axios.post<{ status: ELoginStatus, error_form?: object, message?: string }>(useLangStore().locale + '/jx/login/',
    (new URLSearchParams({ username, password })).toString(), /*qs.stringify({username, password})*/
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
}

/**
 * Perform login request
 */
function jwt_login(username: string, password: string) {
  return axios.post<unknown>('/authjwt/api/token/', { username, password });
}

/**
 * Perform logout request
 */
function jwt_logout(token?: string | null) {
  return axios.post<unknown>('/authjwt/api/token/blacklist/', { refresh: token });
}

/**
 * Refresh an expired "access" token
 */
function jwt_refresh(token: string) {
  return axios.post<{ access: string }>('/authjwt/api/token/refresh/', { refresh: token });
}

/**
 * Heartbeat request (PING -> PONG)
 */
function jwt_ping() {
  return axios.get<{ id: 'PONG' }>('/authjwt/api/ping/', { params: { id: 'PONG' } });
}

interface IUserState {
  me: User | null;
}

export const useAuthStore = defineStore('auth', {

  state: (): IUserState => ({
    me: null,
  }),

  getters: {
    isLoggedIn: (state): boolean => state.me != null,
  },

  actions: {

    fetchWhoAmI() {
      return get_from_portal<IWhoAmI>('/api/whoami/')
        .then((u) => { if (u.is_authenticated) { this.setUser(new User(u)); } })
        .catch((e) => { this.setUser(null); })
    },

    logout() {
      // TODO: conditionally handle logout managers
      return Promise.all([
        jwt_logout(useRootStore().refresh_token),
        jx_logout(),
      ])
        // loginManager()
        .then((u) => {
          this.setUser(null);
        })
    },

    async login(username: string, password: string) {
      const data = await ((useRootStore().useCookies) ? jx_login : jwt_login)(username, password);
      if (!useRootStore().useCookies) {
        useRootStore().setTokens({ ...data });
      }
      if (data && (data.status === ELoginStatus.OK || !useRootStore().useCookies)) {
        this.fetchWhoAmI();
      } else {
        this.setUser(null);
        throw data.error_form;
      }
    },

    refresh() {
      // prevent sending multiple token requests
      if (!refreshTokenPromise) {
        refreshTokenPromise = new Promise((resolve, reject) => {
          // TODO: update `ILoginManager` interface ?
          // loginManager()
          jwt_refresh(useRootStore().refresh_token)
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
            .finally(() => { refreshTokenPromise = null; });
        });
      }
      return refreshTokenPromise;
    },

    setUser(i: User | null) {
      this.me = i;
    }

  }

});