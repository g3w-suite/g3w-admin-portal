import { groupManager } from '@/api/managers/groupManager';
import { IGroup } from '@/types/IGroup';
import { IGroupState } from '@/types/IGroupState';
import { IRootState } from '@/types/IRootState';
import { Group, IGroupDict } from '@/types/TGroup';
import { IMacroGroupDict, MacroGroup } from '@/types/TMacroGroup';
import { Project } from '@/types/TProject';
import { ISuperGroupDict, SuperGroup } from '@/types/TSuperGroup';
import Vue from 'vue';
import { ActionTree, GetterTree, MutationTree } from 'vuex';

const groupState: IGroupState = {
  MacroGroups: {},
  GroupsWithNoMacroGroup: {},
  Groups: {},
  GroupsInMacroGroups: {},
  ProjectsInGroups: {},
  Projects: [],
  ActiveGroup: null,
  Search: '',
};

const getters: GetterTree<IGroupState, IRootState> = {
  macroGroups:            (state): IMacroGroupDict           => state.MacroGroups,
  search:                 (state): string                    => state.Search,
  activeGroup:            (state): SuperGroup | null         => state.ActiveGroup,
  superGroups:            (state): ISuperGroupDict           => Object.assign({}, state.MacroGroups, state.Groups),
  groupsWithNoMacroGroup: (state): IGroupDict                => state.GroupsWithNoMacroGroup,
  groupsInMacroGroup:     (state): (id: number) => Group[]   => (id: number) => state.GroupsInMacroGroups[id],
  groups:                 (state): IGroupDict                => state.Groups,
  projectsInGroup:        (state): (id: number) => Project[] => (id: number) => state.ProjectsInGroups[id],
  projects:               (state): Project[]                 => state.Projects,
  filteredProjects:       (state): Project[]                 => {
    const s = state.Search.toLowerCase();
    return state.Projects.filter(
      (p) => p.title.toLowerCase().includes(s) || p.description.toLowerCase().includes(s),
    );
  },
};

const actions: ActionTree<IGroupState, IRootState> = {
  reset:            ({commit}): void => { commit('reset'); },
  search:           ({commit}, {s}): void => { commit('search', s); },
  setActiveGroup:   ({commit}, {sg}): void => { commit('setActiveGroup', sg); },

  fetchProjects: ({commit}, {locale}): Promise<void> =>
    groupManager
      .projects(locale)
      .then((i) => { commit('setProjects', i.map((p) => new Project(p))); })
      .catch(),

  fetchMacroGroups: ({commit}, {locale}): Promise<void> =>
    groupManager
      .macrogroups(locale)
      .then((i) => { i.forEach((m) => { commit('setMacroGroups', new MacroGroup(m)); }); })
      .catch(),

  fetchGroupsWithNoMacroGroup: ({commit}, {locale}): Promise<void> =>
    groupManager
      .groupsNoMacrogroups(locale)
      .then((i) => {
        i.forEach((g: IGroup) => {
          const gr = new Group(g);
          commit('setGroupWithNoMacroGroup', gr);
          commit('setGroup', gr);
        });
      }),

  fetchGroups: ({commit}, {locale}): Promise<void> =>
    groupManager
      .groups(locale)
      .then((i) => { i.forEach((g) => { commit('setGroup', new Group(g)); }); }),

  fetchGroupsByMacroGroupId: ({commit}, {locale, id}): Promise<void> =>
    groupManager
      .groupsInMacrogroup(locale, id)
      .then((i) => {
        commit('setGroupsOfMacrogroup', {
          id, gps: i.map((g) => {
            const gr = new Group(g);
            commit('setGroup', gr);
            return gr;
          }),
        });
      }),

  fetchProjectsByGroupId: ({commit}, {locale, id}): Promise<void> =>
    groupManager
      .projectsInGroup(locale, id)
      .then((i) => {
        commit('setProjectsOfGroup', {
          id, prj: i.map((p) => {
            return new Project(p);
          }),
        });
      }),

};

const mutations: MutationTree<IGroupState> = {
  setActiveGroup:           (state, sg): void  => { state.ActiveGroup = sg; },
  setMacroGroups:           (state, mc): void  => { Vue.set(state.MacroGroups, mc.id, mc); },
  setGroupWithNoMacroGroup: (state, g): void   => { Vue.set(state.GroupsWithNoMacroGroup, g.id, g); },
  setGroup:                 (state, g): void   => { Vue.set(state.Groups, g.id, g); },
  setGroupsOfMacrogroup:    (state, g): void   => { Vue.set(state.GroupsInMacroGroups, g.id, g.gps); },
  setProjectsOfGroup:       (state, g): void   => { Vue.set(state.ProjectsInGroups, g.id, g.prj); },
  setProjects:              (state, ps): void  => { state.Projects = ps; },
  search:                   (state, s): void   => { state.Search = s; },
  reset:                    (state): void      => {
    state.MacroGroups            = {};
    state.GroupsWithNoMacroGroup = {};
    state.Groups                 = {};
    state.GroupsInMacroGroups    = {};
    state.ProjectsInGroups       = {};
  },
};

export default {
  namespaced: true,
  state: groupState,
  getters,
  actions,
  mutations,
};
