import {StoreOptions} from 'vuex';
import Vue from 'vue';
import Vuex from 'vuex';
import info from '@/store/modules/info';
import group from '@/store/modules/group';
import me from '@/store/modules/me';
import modal from '@/store/modules/modal';
import menu from '@/store/modules/menu';
import settings from '@/store/modules/settings';

Vue.use(Vuex);

export interface RootState {
  showLoader: boolean;
  errors: string[];
}

const store: StoreOptions<RootState> = {
  state: {
    showLoader: false,
    errors: [],
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
  },
  mutations: {
    setLoader(state, show) {
      state.showLoader = show;
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
