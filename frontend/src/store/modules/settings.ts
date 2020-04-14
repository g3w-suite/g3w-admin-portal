import {ActionTree, GetterTree, MutationTree} from 'vuex';
import {RootState} from '@/store/types';

const namespaced: boolean = true;

interface ISettings {
    portalSections: string[];
}

const settings: ISettings = {
    portalSections: [],
};

const getters: GetterTree<ISettings, RootState> = {
    portalSections: (state) => {
        return state.portalSections;
    }
};

const actions: ActionTree<ISettings, RootState> = {
    portalSections: ({commit}, {sections}) => {
        commit('portalSections', sections)
    }
};

const mutations: MutationTree<ISettings> = {
    portalSections: (state, sections) => {
        state.portalSections = sections;
    }
};


export default {
    namespaced,
    state: settings,
    getters,
    actions,
    mutations,
};
