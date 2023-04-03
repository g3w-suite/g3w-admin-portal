import config from '@/config';
import group from '@/store/group';
import info from '@/store/info';
import me from '@/store/me';
import menu from '@/store/menu';
import modal from '@/store/modal';
import settings from '@/store/settings';
import { IRootState } from '@/types/IRootState';
import { sameOrigin } from '@/utils';
import axios from 'axios';
import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';

Vue.use(Vuex);

const store: StoreOptions<IRootState> = {
  state: {
    showLoader: false,
    errors: [],
    access_token: localStorage.getItem('access_token'),
    refresh_token: localStorage.getItem('refresh_token'),
    crossOrigin: !sameOrigin((window as any).location, config.api_base_url), // TODO: || config.useAuthTokens,
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
    // run the below action to get a new access token on expiration
    refreshTokens({commit, state}) {
      return new Promise((resolve, reject) => {
        axios
        .create({
          baseURL: config.api_base_url,
          headers: { 'Content-Type': 'application/json' },
        })
        // send the stored refresh token to the backend API
        .post('/authjwt/api/token/refresh/', { refresh: state.refresh_token })
          .then((response) => { // if API sends back new access and refresh token update the store
            console.log('New access successfully generated');
            commit('setTokens', { ...response.data });
            resolve(response.data.access);
          })
          .catch((err) => {
            console.log('error in refreshToken Task');
            reject(err); // error generating new access and refresh token because refresh token has expired
          });
      });
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

export default new Vuex.Store(store);
