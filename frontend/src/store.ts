import * as Vuex from 'vuex';

import config from '@/config';
import group from '@/store/group';
import info from '@/store/info';
import me from '@/store/me';
import menu from '@/store/menu';
import modal from '@/store/modal';
import settings from '@/store/settings';
import { IRootState } from '@/types/IRootState';
import { sameOrigin } from '@/utils';

// TODO: write some tests ...
const refresh_token = false; // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTY4MDY4MTYyNSwiaWF0IjoxNjgwNTk1MjI1LCJqdGkiOiJlZTBlMzUwNTdlNzM0YWU3YjBkODViZjFmZjNhM2RhMSIsInVzZXJfaWQiOjJ9.pDWo9Ei5f1ZMpjGmG2Um2V_xiCTaCMxzqkbNzVeFOvE" ;

const store_options: Vuex.StoreOptions<IRootState> = {
  state: {
    showLoader: false,
    errors: [],
    access_token: refresh_token || localStorage.getItem('access_token') || '',
    refresh_token: refresh_token || localStorage.getItem('refresh_token') || '',
    crossOrigin: !sameOrigin((window as any).location, config.api_base_url),
    useCookies: !['Bearer', 'JWT'].includes(config.auth_mode),
  },
  modules: {
    info,
    group,
    me,
    modal,
    menu,
    settings,
  },
  getters: {
    showLoader(state): boolean {
      return state.showLoader;
    },
    errors(state): string[] {
      return state.errors;
    },
  },
  actions: {
    showLoader({commit}) {
      commit('setLoader', true);
    },
    hideLoader({commit}) {
      commit('setLoader', false);
    },
    addError({commit}, error) {
      commit('addError', error);
    },
    removeErrors({commit}) {
      commit('removeErrors');
    },
    setTokens({ commit }, newToken) {
      commit('setLocalStorage', { name: 'access_token', value: newToken.access });
      commit('setLocalStorage', { name: 'refresh_token', value: newToken.refresh });
    },
    removeTokens({ commit }) {
      commit('setLocalStorage', { name: 'access_token' });
      commit('setLocalStorage', { name: 'refresh_token' });
    },
  },
  mutations: {
    setLoader(state, show) {
      state.showLoader = show;
    },
    setLocalStorage(state, { name, value = null }: { name: 'access_token'| 'refresh_token', value: string | null }) {
      // TODO: for security purposes, take localStorage out of the project
      if (value) {
        localStorage.setItem(name, value);
      } else {
        localStorage.removeItem(name);
      }
      state[name] = value;
    },
    addError(state, error: string) {
      state.errors.push(error);
    },
    removeErrors(state) {
      state.errors = [];
    },
  },
};

const store = Vuex.createStore(store_options);

export default store;
