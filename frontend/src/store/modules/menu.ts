import {ActionTree, GetterTree, MutationTree} from 'vuex';
import {RootState} from '@/store/types';

const namespaced: boolean = true;

interface IMenuState {
    visibility: boolean;
}

const menuState: IMenuState = {
    visibility: false,
};

const getters: GetterTree<IMenuState, RootState> = {
    isVisible(state): boolean {
        return state.visibility;
    },
};

const actions: ActionTree<IMenuState, RootState> = {
    setVisibility({commit}, {v}) {
        commit('setVisibility', v);
    },
    toggleVisibility({commit}) {
        commit('toggle');
    },
};

const mutations: MutationTree<IMenuState> = {
    setVisibility(state, v) {
        state.visibility = v;
    },
    toggle(state) {
        state.visibility = !state.visibility;
    },
};


export default {
    namespaced,
    state: menuState,
    getters,
    actions,
    mutations,
};
