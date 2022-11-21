import { IMenuState } from '@/types/IMenuState';
import { IRootState } from '@/types/IRootState';
import { ActionTree, GetterTree, MutationTree } from 'vuex';

const menuState: IMenuState = {
  visibility: false,
};

const getters: GetterTree<IMenuState, IRootState> = {
  isVisible: (state): boolean => state.visibility,
};

const actions: ActionTree<IMenuState, IRootState> = {
  setVisibility:    ({commit}, {v}): void => { commit('setVisibility', v); },
  toggleVisibility: ({commit}): void      => { commit('toggle'); },
};

const mutations: MutationTree<IMenuState> = {
  setVisibility: (state, v): void => { state.visibility = v; },
  toggle:        (state): void => { state.visibility = !state.visibility; },
};

export default {
  namespaced: true,
  state: menuState,
  getters,
  actions,
  mutations,
};
