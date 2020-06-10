import {ActionTree, GetterTree, MutationTree} from 'vuex';
import {RootState} from '@/store/types';
import User from '@/datastore/types/User';
import {loginManager} from '@/datastore/managers/loginManager';
import {ELoginStatus} from '@/datastore/interfaces/LoginInterfaces';

const namespaced: boolean = true;

interface IUserState {
    me: User | null;
}

const userState: IUserState = {
    me: null,
};

const getters: GetterTree<IUserState, RootState> = {
    me(state): User | null {
        return state.me;
    },
    someoneIsLogged(state): boolean {
        return state.me != null;
    },
};

const actions: ActionTree<IUserState, RootState> = {

    fetchWhoAmI({commit},{locale}) {
        return loginManager.who_am_i(locale).then((u) => {
            if (u.is_authenticated) {
                commit('setUser', new User(u));
            }
        }).catch((e) => {
            commit('setUser', null);
        });
    },
    logout({commit}, {locale}) {
        return loginManager.logout(locale).then((u) => {
            commit('setUser', null);
        });
    },
    login({commit, dispatch}, {locale, username, password}) {
        return loginManager.login(locale, username, password).then((data) => {
            if (data && data.status === ELoginStatus.OK) {
                dispatch('fetchWhoAmI',{locale});
            } else {
                commit('setUser', null);
                throw data.error_form
            }
        })
    },
};

const mutations: MutationTree<IUserState> = {
    setUser(state, i) {
        state.me = i;
    },
};


export default {
    namespaced,
    state: userState,
    getters,
    actions,
    mutations,
};
