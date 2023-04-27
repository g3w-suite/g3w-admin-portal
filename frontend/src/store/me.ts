import { jwtManager } from '@/api/managers/jwtManager';
import { loginManager as sessionManager } from '@/api/managers/loginManager';
import config from '@/config';
import { ELoginStatus } from '@/types/ELoginStatus';
import { IRootState } from '@/types/IRootState';
import { IUserState } from '@/types/IUserState';
import User from '@/types/TUser';
import { loginManager } from '@/utils';
import { ActionTree, GetterTree, MutationTree } from 'vuex';

// TODO: should we make this variable a `userState` property?
let refreshTokenPromise: Promise<any> | null;

const userState: IUserState = {
  me: null,
};

const getters: GetterTree<IUserState, IRootState> = {
  me:         (state): User | null => state.me,
  isLoggedIn: (state): boolean     => state.me != null,
};

const actions: ActionTree<IUserState, IRootState> = {

  fetchWhoAmI: ({commit, rootState}, {locale}): Promise<void> =>
    loginManager(rootState)
      .who_am_i(locale)
      .then((u) =>  { if (u.is_authenticated) { commit('setUser', new User(u)); } })
      .catch((e) => { commit('setUser', null); }),

  logout: ({commit, dispatch, rootState}, {locale}): Promise<void> =>
      // TODO: conditionally handle logout managers
      Promise.all([
        jwtManager.logout(locale, rootState.refresh_token),
        sessionManager.logout(locale),
      ])
      // loginManager(rootState)
      .then((u) => {
        commit('setUser', null);
      }),

  login: ({commit, dispatch, rootState}, {locale, username, password}): Promise<void> =>
    loginManager(rootState)
      .login(locale, username, password)
      .then((data) => {
        if (!rootState.useCookies) {
          dispatch('setTokens', { ...data }, { root: true });
        }
        if (data && (data.status === ELoginStatus.OK || !rootState.useCookies)) {
          dispatch('fetchWhoAmI', {locale});
        } else {
          commit('setUser', null);
          throw data.error_form;
        }
      }),

    refresh({dispatch, rootState}) {
      // prevent sending multiple token requests
      if (!refreshTokenPromise) {
        refreshTokenPromise = new Promise((resolve, reject) => {
          // TODO: update `ILoginManager` interface ?
          // loginManager(rootState)
          jwtManager
            .refresh(rootState.refresh_token)
            .then((data: { access: string }) => {
              dispatch('setTokens', { access: data.access, refresh: rootState.refresh_token }, { root: true });
              resolve(data.access);
            })
            .catch((err: unknown) => {
              dispatch('removeTokens', undefined, { root: true });
              // TODO: logout without reload application on expired or invalid refresh token
              window.location.reload();
              reject(err);
            })
            .finally(() => { refreshTokenPromise = null; });
        });
      }
      return refreshTokenPromise;
    },

};

const mutations: MutationTree<IUserState> = {
  setUser: (state, i): void => {
    state.me = i; // TODO find out if doing like so could be more reccomended: `Vue.set(state, 'me', i);`
  },
};

export default {
  namespaced: true,
  state: userState,
  getters,
  actions,
  mutations,
};
