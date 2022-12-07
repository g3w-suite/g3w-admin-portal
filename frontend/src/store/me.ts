import { loginManager } from '@/api/managers/loginManager';
import { ELoginStatus } from '@/types/ELoginStatus';
import { ILogoutResponse } from '@/types/ILogoutResponse';
import { IRootState } from '@/types/IRootState';
import { IUserState } from '@/types/IUserState';
import User from '@/types/TUser';
import { ActionTree, GetterTree, MutationTree } from 'vuex';

const userState: IUserState = {
  me: null,
};

const getters: GetterTree<IUserState, IRootState> = {
  me:         (state): User | null => state.me,
  isLoggedIn: (state): boolean     => state.me != null,
};

const actions: ActionTree<IUserState, IRootState> = {

  fetchWhoAmI: ({commit}, {locale}): Promise<void> =>
    loginManager
      .who_am_i(locale)
      .then((u) =>  { u.is_authenticated && commit('setUser', new User(u)); })
      .catch((e) => { commit('setUser', null); }),

  logout: ({commit}, {locale}): Promise<void> =>
    loginManager
      .logout(locale)
      .then((u) => { commit('setUser', null); }),

  login: ({commit, dispatch}, {locale, username, password}): Promise<void> =>
    loginManager
      .login(locale, username, password)
      .then((data) => {
        if (data && data.status === ELoginStatus.OK) {
          dispatch('fetchWhoAmI', {locale});
        } else {
          commit('setUser', null);
          throw data.error_form;
        }
      }),
};

const mutations: MutationTree<IUserState> = {
  setUser: (state, i): void => { state.me = i; },
};

export default {
  namespaced: true,
  state: userState,
  getters,
  actions,
  mutations,
};
