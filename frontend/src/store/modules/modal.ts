import {ActionTree, GetterTree, MutationTree} from 'vuex';
import {RootState} from '@/store/types';

const namespaced: boolean = true;

interface IModalState {
    img_link: string;
    title: string;
}

const modalState: IModalState = {
    img_link: '',
    title: '',
};

const getters: GetterTree<IModalState, RootState> = {
    url(state): string {
        return state.img_link;
    },
    title(state): string {
        return state.title;
    },
};

const actions: ActionTree<IModalState, RootState> = {
    reset({commit}) {
        commit('reset');
    },
    setUrl({commit}, {url}) {
        commit('setUrl', url);
    },
    setTitle({commit}, {title}) {
        commit('setTitle', title);
    },
};

const mutations: MutationTree<IModalState> = {
    reset(state) {
        state.img_link = '';
        state.title = '';
    },
    setUrl(state, url) {
        state.img_link = url;
    },
    setTitle(state, title) {
        state.title = title;
    },
};


export default {
    namespaced,
    state: modalState,
    getters,
    actions,
    mutations,
};
