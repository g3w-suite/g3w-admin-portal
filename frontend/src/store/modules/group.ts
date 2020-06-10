import {ActionTree, GetterTree, MutationTree} from 'vuex';
import {RootState} from '@/store/types';
import {IGroupInMacrogroupDict, IMacroGroupDict, MacroGroup} from '@/datastore/types/MacroGroup';
import {Group, IGroupDict} from '@/datastore/types/Group';
import Vue from 'vue';
import {groupManager} from '@/datastore/managers/groupManager';
import {IGroup} from '@/datastore/interfaces/GroupInterface';
import {IMacroGroup} from '@/datastore/interfaces/MacroGroupInterface';
import {IProgectInGroupDict, Project} from '@/datastore/types/Project';
import {i18n} from "@/main";
import {SuperGroup} from "@/datastore/types/SuperGroup";

const namespaced: boolean = true;

interface IGroupState {
    MacroGroups: IMacroGroupDict;
    GroupsWithNoMacroGroup: IGroupDict;
    Groups: IGroupDict;
    GroupsInMacroGroups: IGroupInMacrogroupDict;
    ProjectsInGroups: IProgectInGroupDict;
    Projects: Project[];
    ActiveGroup: SuperGroup | null;
    Search: string
}

const infoState: IGroupState = {
    MacroGroups: {},
    GroupsWithNoMacroGroup: {},
    Groups: {},
    GroupsInMacroGroups: {},
    ProjectsInGroups: {},
    Projects: [],
    ActiveGroup: null,
    Search: ''
};

const getters: GetterTree<IGroupState, RootState> = {
    macroGroups(state): IMacroGroupDict {
        return state.MacroGroups;
    },

    search(state): string{
        return state.Search
    },

    fitleredProjects(state): Project[]{
        const s = state.Search.toLowerCase()
        return state.Projects.filter((p)=>{
            return p.title.toLowerCase().includes(s) || p.description.toLowerCase().includes(s)
        })
    },

    activeGroup(state):SuperGroup|null{
        return state.ActiveGroup
    },

    groupsWithNoMacroGroup(state): IGroupDict {
        return state.GroupsWithNoMacroGroup;
    },

    groups(state): IGroupDict {
        return state.Groups;
    },
    groupsInMacroGroup: (state) => (id: number) => {
        return state.GroupsInMacroGroups[id];
    },
    projectsInGroup: (state) => (id: number) => {
        return state.ProjectsInGroups[id];
    },
};

const actions: ActionTree<IGroupState, RootState> = {
    reset({commit}) {
        commit('reset');
    },

    search({commit},{s}) {
        commit('search',s);
    },

    fetchProjects({commit},{locale}){
        return groupManager.projects(locale).then((i) => {
            const ps = i.map((p) => {
                return new Project(p);
            });
            commit('setProjects',ps)
        }).catch();
    },

    fetchMacroGroups({commit}, {locale}) {
        return groupManager.macrogroups(locale).then((i) => {
            i.forEach((m) => {
                commit('setMacroGroups', new MacroGroup(m));
            });
        }).catch();
    },

    setActiveGroup({commit}, {sg}){
        commit('setActiveGroup',sg);

    },

    fetchGroupsWithNoMacroGroup({commit}, {locale}) {
        return groupManager.groupsNoMacrogroups(locale).then((i) => {
            i.forEach((g: IGroup) => {
                const gr = new Group(g);
                commit('setGroupWithNoMacroGroup', gr);
                commit('setGroup', gr);
            });
        });
    },
    fetchGroups({commit}, {locale}) {
        return groupManager.groups(locale).then((i) => {
            i.forEach((g) => {
                commit('setGroup', new Group(g));
            });
        });
    },

    fetchGroupsByMacroGroupId({commit}, {locale,id}) {
        return groupManager.groupsInMacrogroup(locale,id).then((i) => {
            commit('setGroupsOfMacrogroup', {
                id, gps: i.map((g) => {
                    const gr = new Group(g);
                    commit('setGroup', gr);
                    return gr;
                }),
            });
        });
    },

    fetchProjectsByGroupId({commit}, {locale,id}) {
        return groupManager.projectsInGroup(locale,id).then((i) => {
            commit('setProjectsOfGroup', {
                id, prj: i.map((p) => {
                    return new Project(p);
                }),
            });
        });
    },
};

const mutations: MutationTree<IGroupState> = {
    reset(state) {
        state.MacroGroups = {};
        state.GroupsWithNoMacroGroup = {};
        state.Groups = {};
        state.GroupsInMacroGroups = {};
        state.ProjectsInGroups = {};
    },
    setActiveGroup(state,sg){
        state.ActiveGroup = sg;
    },
    setMacroGroups(state, mc) {
        Vue.set(state.MacroGroups, mc.id, mc);
    },
    setGroupWithNoMacroGroup(state, g) {
        Vue.set(state.GroupsWithNoMacroGroup, g.id, g);
    },
    setGroup(state, g) {
        Vue.set(state.Groups, g.id, g);
    },
    setGroupsOfMacrogroup(state, g) {
        Vue.set(state.GroupsInMacroGroups, g.id, g.gps);
    },
    setProjectsOfGroup(state, g) {
        Vue.set(state.ProjectsInGroups, g.id, g.prj);
    },
    setProjects(state,ps){
        state.Projects = ps
    },
    search(state, s) {
        state.Search = s
    },
};


export default {
    namespaced,
    state: infoState,
    getters,
    actions,
    mutations,
};
