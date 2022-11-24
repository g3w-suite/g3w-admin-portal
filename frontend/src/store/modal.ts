import { IModalState } from '@/types/IModalState';
import { IRootState } from '@/types/IRootState';
import { ActionTree, GetterTree, MutationTree } from 'vuex';

const modalState: IModalState = {
  img_link: '',
  title: '',
};

const getters: GetterTree<IModalState, IRootState> = {
  url:   (state): string => state.img_link,
  title: (state): string => state.title,
};

const actions: ActionTree<IModalState, IRootState> = {
  reset:    ({commit}): void          => { commit('reset'); },
  setUrl:   ({commit}, {url}): void   => { commit('setUrl', url); },
  setTitle: ({commit}, {title}): void => { commit('setTitle', title); },
};

const mutations: MutationTree<IModalState> = {
  reset(state) {
    state.img_link = '';
    state.title = '';
  },
  setUrl:   (state, url): void   => { state.img_link = url; },
  setTitle: (state, title): void => { state.title = title; },
};

export default {
  namespaced: true,
  state: modalState,
  getters,
  actions,
  mutations,
};
