import group from '@/store/group';
import info from '@/store/info';
import me from '@/store/me';
import menu from '@/store/menu';
import modal from '@/store/modal';
import settings from '@/store/settings';
import { IRootState } from '@/types/IRootState';
import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';

Vue.use(Vuex);

const store: StoreOptions<IRootState> = {
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
