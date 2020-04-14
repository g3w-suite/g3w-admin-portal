import {ActionTree, GetterTree, MutationTree} from 'vuex';
import {RootState} from '@/store/types';

const namespaced: boolean = true;

interface ISettings {
    portalSections: string[];
    showAdminButton: boolean,
}

const settings: ISettings = {
    portalSections: [],
    showAdminButton: false,
};

const getters: GetterTree<ISettings, RootState> = {
    portalSections: (state) => {
        return state.portalSections;
    },
    showAdminButton:(state) => {
        return state.showAdminButton;
    }
};

const actions: ActionTree<ISettings, RootState> = {
    portalSections: ({commit}, {sections}) => {
        commit('portalSections', sections)
    },
    showAdminButton: ({commit}, {show}) => {
        commit('showAdminButton', show)
    },
}

const mutations: MutationTree<ISettings> = {
    portalSections: (state, sections) => {
        state.portalSections = sections;
    },
    showAdminButton: (state, show) => {
        state.showAdminButton = show;
    }
};


export default {
    namespaced,
    state: settings,
    getters,
    actions,
    mutations,
};
