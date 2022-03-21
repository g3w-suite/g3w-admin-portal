import {ActionTree, GetterTree, MutationTree} from 'vuex';
import {RootState} from '@/store/types';
import {portalManager} from '@/datastore/managers/portalManager';
import {IPictures} from '@/datastore/interfaces/PortalInterface';
import {i18n} from '@/main';

const namespaced: boolean = true;

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

const getters: GetterTree<ISettings, RootState> = {
    portalSections: (state) => {
        return state.portalSections;
    },
    showAdminButton: (state) => {
        return state.showAdminButton;
    },
    pictures: (state) => {
        return state.pictures;
    },
};

const actions: ActionTree<ISettings, RootState> = {
    portalSections: ({commit}, {sections}) => {
        commit('portalSections', sections);
    },
    showAdminButton: ({commit}, {show}) => {
        commit('showAdminButton', show);
    },
    fetchPictures: ({commit}, {locale}) => {
        portalManager.pictures(locale).then((ps) => {
            const pictures = ps.sort((a: IPictures, b: IPictures) => {
                if (a.order < b.order) {
                    return -1;
                }
                if (a.order > b.order) {
                    return 1;
                }
                return 0;
            });
            commit('setPictures', pictures);
        });
    },
};

const mutations: MutationTree<ISettings> = {
    portalSections: (state, sections) => {
        state.portalSections = sections;
    },
    showAdminButton: (state, show) => {
        state.showAdminButton = show;
    },
    setPictures: (state, ps) => {
        state.pictures = ps;
    },
};


export default {
    namespaced,
    state: settings,
    getters,
    actions,
    mutations,
};
