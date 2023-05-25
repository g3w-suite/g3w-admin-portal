import { Group } from '@/types/TGroup';
import { MacroGroup } from '@/types/TMacroGroup';
import { Project } from '@/types/TProject';

import { IGroup } from '@/types/IGroup';
import { SuperGroup } from '@/types/TSuperGroup';
import { IMacroGroup } from '@/types/IMacroGroup';
import { IProject } from '@/types/IProject';
import { get_from_portal } from '@/utils';

import { defineStore } from 'pinia'

interface IGroupState {
  projects:               Project[];
  macroGroups:            { [key: number]: MacroGroup; };
  groupsWithNoMacroGroup: { [key: number]: Group };
  groups:                 { [key: number]: Group };
  GroupsInMacroGroups:    { [key: number]: Group[]; };
  ProjectsInGroups:       { [key: number]: Project[]; };
  activeGroup:            SuperGroup | null;
  search:                 string;
}

export const useGroupStore = defineStore('group', {

  state: (): IGroupState => ({
    macroGroups: {},
    groupsWithNoMacroGroup: {},
    groups: {},
    GroupsInMacroGroups: {},
    ProjectsInGroups: {},
    projects: [],
    activeGroup: null,
    search: '',
  }),

  getters: {
    macroGroup:             (state): (id: number) => MacroGroup => (id: number) => state.macroGroups[id],
    groupsInMacroGroup:     (state): (id: number) => Group[]   => (id: number) => state.GroupsInMacroGroups[id],
    projectsInGroup:        (state): (id: number) => Project[] => (id: number) => state.ProjectsInGroups[id],
    superGroups:            (state): SuperGroup[]              => [
      ...Object.values(state.macroGroups),
      ...Object.values(state.groupsWithNoMacroGroup),
    ],
    filteredProjects:       (state): Project[]                 => {
      const s = state.search.toLowerCase();
      return state.projects.filter((p) => p.title.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
    },

  },

  actions: {

    reset() {
      this.macroGroups            = {};
      this.groupsWithNoMacroGroup = {};
      this.groups                 = {};
      this.GroupsInMacroGroups    = {};
      this.ProjectsInGroups       = {};
    },

    setSearchFilter(s: string) {
      this.search = s;
    },

    setActiveGroup(sg: SuperGroup | null) {
      this.activeGroup = sg;
    },
  
    /**
     * Fetch all projects
     */
    async fetchProjects() {
      this.projects = (await get_from_portal<IProject[]>('/api/project/')).map((p) => new Project(p));
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
      this.GroupsInMacroGroups[id] = (await get_from_portal<IGroup[]>(`/api/group/${id}`))
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
      this.ProjectsInGroups[id] = (await get_from_portal<IProject[]>(`/api/group/${id}/projects/`)).map((p) => new Project(p));
    },

  }

})
