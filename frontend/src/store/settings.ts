import { picturesManager } from '@/api/managers/picturesManager';
import { i18n } from '@/main';
import { IPictures } from '@/types/IPictures';
import { IRootState } from '@/types/IRootState';
import { ActionTree, GetterTree, MutationTree } from 'vuex';

interface ISettings {
  portalSections: string[];
  showAdminButton: boolean;
  pictures: IPictures[];
}

const settings: ISettings = {
  portalSections: [],
  showAdminButton: false,
  pictures: [],
};

const getters: GetterTree<ISettings, IRootState> = {
  portalSections:  (state): string[]    => state.portalSections,
  showAdminButton: (state): boolean     => state.showAdminButton,
  pictures:        (state): IPictures[] => state.pictures,
};

const actions: ActionTree<ISettings, IRootState> = {
  portalSections:  ({commit}, {sections}): void => { commit('portalSections', sections); },
  showAdminButton: ({commit}, {show}): void     => { commit('showAdminButton', show); },
  fetchPictures:   ({commit}, {locale}): void   => {
    picturesManager.pictures(locale).then((ps)  => {
      const pictures = ps.sort((a: IPictures, b: IPictures) => {
        if (a.order < b.order) { return -1; }
        if (a.order > b.order) { return 1; }
        return 0;
      });
      commit('setPictures', pictures);
    });
  },
};

const mutations: MutationTree<ISettings> = {
  portalSections:  (state, sections): void => { state.portalSections = sections; },
  showAdminButton: (state, show): void     => { state.showAdminButton = show; },
  setPictures:     (state, ps): void       => { state.pictures = ps; },
};

export default {
  namespaced: true,
  state: settings,
  getters,
  actions,
  mutations,
};
