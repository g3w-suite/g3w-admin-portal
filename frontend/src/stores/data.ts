import { Group } from '@/types/TGroup';
import { MacroGroup } from '@/types/TMacroGroup';
import { Project } from '@/types/TProject';
import { IGroup } from '@/types/IGroup';
import { SuperGroup } from '@/types/TSuperGroup';
import { IMacroGroup } from '@/types/IMacroGroup';
import { IProject } from '@/types/IProject';
import { Info } from '@/types/TInfo';
import { IInfo } from '@/types/IInfo';
import { IPictures } from '@/types/IPictures';
import { get_from_portal } from '@/utils';

import { defineStore } from 'pinia';

import { router } from '@/plugins';
import { useRootStore } from './root';
import { RouteLocationNormalizedLoaded as Route } from 'vue-router';

interface IDataState {
  projects: Project[];
  macroGroups: { [key: number]: MacroGroup; };
  groupsWithNoMacroGroup: { [key: number]: Group };
  groups: { [key: number]: Group };
  GroupsInMacroGroups: { [key: number]: Group[]; };
  ProjectsInGroups: { [key: number]: Project[]; };
  activeGroup: SuperGroup | null;
  search: string;
  info: Info;
  pictures: IPictures[];
}

export const useDataStore = defineStore('data', {

  state: (): IDataState => ({
    macroGroups: {},
    groupsWithNoMacroGroup: {},
    groups: {},
    GroupsInMacroGroups: {},
    ProjectsInGroups: {},
    projects: [],
    activeGroup: null,
    search: '',
    info: new Info(),
    pictures: [],
  }),

  getters: {
    macroGroup: (state): (id: number) => MacroGroup => (id: number) => state.macroGroups[id],
    groupsInMacroGroup: (state): (id: number) => Group[] => (id: number) => state.GroupsInMacroGroups[id],
    projectsInGroup: (state): (id: number) => Project[] => (id: number) => state.ProjectsInGroups[id],
    superGroups: (state): SuperGroup[] => [
      ...Object.values(state.macroGroups),
      ...Object.values(state.groupsWithNoMacroGroup),
    ],
    filteredProjects: (state): Project[] => {
      const s = state.search.toLowerCase();
      return state.projects.filter((p) => p.title.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
    },

  },

  actions: {

    reset() {
      this.macroGroups = {};
      this.groupsWithNoMacroGroup = {};
      this.groups = {};
      this.GroupsInMacroGroups = {};
      this.ProjectsInGroups = {};
    },

    setSearchFilter(s: string) {
      this.search = s;
    },

    /**
     * Make sure that 'group/ActiveGroup' getter is always set after each route change
     */
    async setActiveGroup(to: Route) {
      // const to = router.currentRoute.value;
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
        this.activeGroup = sg;
      }
    },

    unsetActiveGroup() {
      this.activeGroup = null;
    },

    async fetchInfo() {
      this.info = new Info(await get_from_portal<IInfo>('/api/infodata/'));
    },

    async fetchPictures() {
      this.pictures = (await get_from_portal<IPictures[]>('/api/pictures/'))
        .sort((a: IPictures, b: IPictures) => {
          if (a.order < b.order) { return -1; }
          if (a.order > b.order) { return 1; }
          return 0;
        });
    },

    /**
     * Fetch all projects
     */
    async fetchProjects() {
      this.projects = (await get_from_portal<IProject[]>('/api/project/')).map((p) => new Project(p));
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
        const groups = this.groups;
        if (undefined !== group && undefined === groups[parseInt(group as string)]) {
          useRootStore().showLoader();
          await this.fetchGroupsByMacroGroupId(id as string);
          useRootStore().hideLoader();
        }
        const activeGroup: Group = groups[parseInt((group || id) as string)];
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
        const macroGroups = this.macroGroups;
        const macrogroup = macroGroups[parseInt(id as string)];
        if (!macrogroup) { // inexistent group ID or unauthenticated user
          return false;
        }
        await (macrogroup as MacroGroup).fetchGroups();
        return macrogroup;
      } else if (group) {
        return await this.fetchGroupData();
      }
      return null;
    },

    /**
     * Fetch all macrogroups
     */
    async fetchMacroGroups() {
      (await get_from_portal<IMacroGroup[]>('/api/macrogroup/')).forEach((m) => {
        const mc = new MacroGroup(m);
        this.macroGroups[mc.id] = mc;
      });
    },

    /**
     * Fetch all groups without a parent macrogroup
     */
    async fetchGroupsWithNoMacroGroup() {
      (await get_from_portal<IGroup[]>('/api/group/nomacrogroup/')).forEach((g) => {
        const gr = new Group(g);
        this.groupsWithNoMacroGroup[gr.id] = gr;
        this.groups[gr.id] = gr;
      });
    },

    /**
     * Fetch all groups
     */
    async fetchGroups() {
      (await get_from_portal<IGroup[]>('/api/group/')).forEach((g) => {
        const gr = new Group(g);
        this.groups[gr.id] = gr;
      });
    },

    /**
     * Fetch all groups within a macrogroup
     */
    async fetchGroupsByMacroGroupId(id: string) {
      this.GroupsInMacroGroups[parseInt(id as string)] = (await get_from_portal<IGroup[]>(`/api/group/${id}`))
        .map((g) => {
          const gr = new Group(g);
          this.groups[gr.id] = gr;
          return gr;
        });
    },

    /**
     * Fetch all projects within a group
     */
    async fetchProjectsByGroupId(id: string) {
      this.ProjectsInGroups[parseInt(id)] = (await get_from_portal<IProject[]>(`/api/group/${id}/projects/`)).map((p) => new Project(p));
    },

  }

})
