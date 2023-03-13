import { InfoManager, infoManager } from '@/api/managers/infoManager';
import { IInfoState } from '@/types/IInfoState';
import { IRootState } from '@/types/IRootState';
import { Info } from '@/types/TInfo';
import { ActionTree, GetterTree, MutationTree } from 'vuex';

const infoState: IInfoState = {
  info: new Info(),
};

const getters: GetterTree<IInfoState, IRootState> = {
  info: (state): Info | null => state.info,
};

const actions: ActionTree<IInfoState, IRootState> = {
  fetchInfo: ({commit}, {locale}): Promise<void> =>
    infoManager
      .infodata(locale)
      .then((i) => { commit('setInfo', i); }),
};

const mutations: MutationTree<IInfoState> = {
  setInfo: (state, i): void => state.info = i,
};

export default {
  namespaced: true,
  state: infoState,
  getters,
  actions,
  mutations,
};
