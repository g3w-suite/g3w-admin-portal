import { ELoginStatus } from '@/types/ELoginStatus';
import { ILogoutResponse } from '@/types/ILogoutResponse';
import { IRootState } from '@/types/IRootState';
import { IUserState } from '@/types/IUserState';
import User from '@/types/TUser';
import { loginManager } from '@/utils';
import { ActionTree, GetterTree, MutationTree } from 'vuex';

const userState: IUserState = {
  me: null,
};

const getters: GetterTree<IUserState, IRootState> = {
  me:         (state): User | null => state.me,
  isLoggedIn: (state): boolean     => state.me != null,
};

const actions: ActionTree<IUserState, IRootState> = {

  fetchWhoAmI: ({commit, rootState}, {locale}): Promise<void> =>
    loginManager(rootState)
      .who_am_i(locale)
      .then((u) =>  { if (u.is_authenticated) { commit('setUser', new User(u)); } })
      .catch((e) => { commit('setUser', null); }),

  logout: ({commit, dispatch, rootState}, {locale}): Promise<void> =>
    loginManager(rootState)
      .logout(locale, rootState.refresh_token)
      .then((u) => {
        if (rootState.crossOrigin) {
          dispatch('removeTokens', undefined, { root: true });
        }
        commit('setUser', null);
      }),

  login: ({commit, dispatch, rootState}, {locale, username, password}): Promise<void> =>
    loginManager(rootState)
      .login(locale, username, password)
      .then((data) => {
        if (rootState.crossOrigin) {
          dispatch('setTokens', { ...data }, { root: true });
        }

        // get and set auth user

        // const ping = () => {
        //   return axiosJWT.get(
        //     store.state.endpoints.heartbeat,
        //     { params: { id: 'PONG' } }
        //     )
        //     .then((response) => Promise.resolve(response.data))
        //     .catch((error) => Promise.reject(error));
        // };

        // ping().then((id) => console.log(id));

        // Even though the authentication returned a user object that can be decoded,
        // we fetch it again. This way we aren't super dependant on JWT and can plug
        // in something else.
        // axiosInstance({
        //   url: "/user/",
        //   method: "get",
        //   params: {},
        // }).then((response) => {
        //   this.$store.commit("setAuthUser", {
        //     authUser: response.data,
        //     isAuthenticated: true,
        //   });
        //   this.$router.push({name: "Home"});
        // });

        if (data && (data.status === ELoginStatus.OK || rootState.crossOrigin)) {
          dispatch('fetchWhoAmI', {locale});
        } else {
          commit('setUser', null);
          throw data.error_form;
        }
      })
      .catch((error) => {
        console.log(error);
        console.debug(error);
        console.dir(error);
      })
      ,
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
