import config from '@/config';
import { sameOrigin } from '@/utils';
import { useInfoStore, useSettingsStore, useGroupStore, useAuthStore } from '@/stores';
import { defineStore } from 'pinia'
import { Group } from '@/types/TGroup';
import { MacroGroup } from '@/types/TMacroGroup';
import router from '@/router';


// TODO: write some tests ...
const refresh_token = false; // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTY4MDY4MTYyNSwiaWF0IjoxNjgwNTk1MjI1LCJqdGkiOiJlZTBlMzUwNTdlNzM0YWU3YjBkODViZjFmZjNhM2RhMSIsInVzZXJfaWQiOjJ9.pDWo9Ei5f1ZMpjGmG2Um2V_xiCTaCMxzqkbNzVeFOvE" ;

interface IRootState {
  isLoading: boolean;
  crossOrigin: boolean;
  access_token: string | null;
  refresh_token: string | null;
  useCookies: boolean;
}

export const useRootStore = defineStore('root', {

  state: (): IRootState => ({
    isLoading: false,
    access_token: refresh_token || localStorage.getItem('access_token') || '',
    refresh_token: refresh_token || localStorage.getItem('refresh_token') || '',
    crossOrigin: !sameOrigin((window as any).location, config.api_base_url),
    useCookies: !['Bearer', 'JWT'].includes(config.auth_mode),
  }),

  actions: {

    showLoader() {
      this.isLoading = true;
    },

    hideLoader() {
      this.isLoading = false;
    },

    setTokens(newToken: { access: string, refresh: string }) {
      this.setLocalStorage('access_token', newToken.access);
      this.setLocalStorage('refresh_token', newToken.refresh);
    },

    removeTokens() {
      this.setLocalStorage('access_token');
      this.setLocalStorage('refresh_token');
    },

    setLocalStorage(id: 'access_token' | 'refresh_token', value?: string | null) {
      // TODO: for security purposes, take localStorage out of the project
      if (value) {
        localStorage.setItem(id, value);
      } else {
        localStorage.removeItem(id);
      }
      this[id] = value;
    },

    /**
     * Fetch general application data
     */
    async fetchData(refresh = false) {
      // disgread JWT tokens after calling: commit('setUser', null)
      if (!this.useCookies && !useAuthStore().user) {
        await this.removeTokens();
      }
      if (refresh) {
        await useGroupStore().reset();
        await this.setActiveGroup();
      }
      this.showLoader();
      await Promise.allSettled([
        useInfoStore().fetchInfo(),
        useSettingsStore().fetchPictures(),
        useGroupStore().fetchMacroGroups(),
        useGroupStore().fetchGroupsWithNoMacroGroup(),
        useGroupStore().fetchProjects(),
      ]);
      this.hideLoader();
    },

    /**
     * Make sure that 'group/ActiveGroup' getter is always set after each route change
     */
    async setActiveGroup() {
      const to = router.currentRoute.value;
      let sg: Group | MacroGroup | null | false = null;

      switch (to.name) {
        case 'group':
          sg = await this.fetchGroupData();
          break;
        case 'organization':
          sg = await this.fetchMacroGroupData();
          break;
      }
      // Redirect users to 404 page when they to visit an inexistent
      // group URL (also applies to unauthenticated user sessions)
      if (false === sg) {
        router.push({ name: '404', params: router.currentRoute.value.params });
      } else {
        useGroupStore().setActiveGroup(sg);
      }
    },

    /**
     * Fetch Group data based on route params
     *
     * @return a valid 'group/ActiveGroup' element
     */
    async fetchGroupData(): Promise<Group | null | false> {
      const { id, group, lang } = router.currentRoute.value.params;

      // Home > Group
      if (undefined !== id) {
        const groups = useGroupStore().groups;
        if (undefined !== group && undefined === groups[group]) {
          this.showLoader();
          await useGroupStore().fetchGroupsByMacroGroupId(lang, id);
          this.hideLoader();
        }
        const activeGroup: Group = groups[group || id];
        if (!activeGroup) {
          return false; // inexistent group ID or unauthenticated user
        }
        await activeGroup.fetchProjects();
        return activeGroup;
      }
      return null;
    },


    /**
     * Fetch MacroGroup data based on route params
     *
     * @return a valid 'group/ActiveGroup' element
     */
    async fetchMacroGroupData(): Promise<Group | MacroGroup | null | false> {
      const { id, group } = router.currentRoute.value.params;

      // Home > MacroGroup
      if (!group && id) {
        const macroGroups = useGroupStore().macroGroups;
        const macrogroup = macroGroups[id];
        if (!macrogroup) { // inexistent group ID or unauthenticated user
          return false;
        }
        await (macrogroup as MacroGroup).fetchGroups();
        return macrogroup;
      } else if (group) {
        return await this.fetchGroupData();
      }
      return null;
    }

  }

})