import {ActionTree, GetterTree, MutationTree} from 'vuex';
import {RootState} from '@/store/types';
import {Info} from '@/datastore/types/Info';
import {infoManager} from '@/datastore/managers/infoManager';
import {i18n} from "@/main";

const namespaced: boolean = true;

interface IInfoState {
    info: Info;
}

const infoState: IInfoState = {
    info: new Info(),
};

const getters: GetterTree<IInfoState, RootState> = {
    info(state): Info | null {
        return state.info;
    },
};

const actions: ActionTree<IInfoState, RootState> = {
    fetchInfo({commit},{locale}) {
        return infoManager.infodata(locale).then((i) => {
            commit('setInfo', i);
        });
    },
};

const mutations: MutationTree<IInfoState> = {
    setInfo(state, i) {
        state.info = i;
    },
};


export default {
    namespaced,
    state: infoState,
    getters,
    actions,
    mutations,
};
