import { jwtManager} from '@/api/managers/jwtManager';
import { loginManager as sessionManager } from '@/api/managers/loginManager';
import store from '@/store';
import { ILoginManager } from '@/types/ILoginManager';
import { IRootState } from '@/types/IRootState';
import { Group } from '@/types/TGroup';
import { MacroGroup } from '@/types/TMacroGroup';
import { Route } from 'vue-router';

/**
 * Check for cross origin URLs.
 */
export function sameOrigin(a: string, b: string): boolean {
    return (new URL(a)).origin === (new URL(b)).origin;
}

/**
 * Factory login manager (Cookie sessions vs JWT Auth).
 */
export function loginManager(state: IRootState): ILoginManager {
    return state.crossOrigin ? jwtManager : sessionManager;
}

/**
 * Fetch some general application data
 */
export async function fetchData(locale: string) {
    store.dispatch('showLoader');
    // @ts-ignore
    await Promise.allSettled([
      store.dispatch('info/fetchInfo', { locale }),
      store.dispatch('settings/fetchPictures', { locale }),
      store.dispatch('group/fetchMacroGroups', { locale }),
      store.dispatch('group/fetchGroupsWithNoMacroGroup', { locale }),
      store.dispatch('group/fetchProjects', { locale }),
    ]);
    store.dispatch('hideLoader');
}

/**
 * Make sure that 'group/ActiveGroup' getter is always set after each route change
 */
export async function setActiveGroup(to: Route) {
    let sg: Group | MacroGroup | null = null;

    switch (to.name) {
        case 'group':
        sg = await fetchGroupData(to);
        break;
        case 'organization':
        sg = await fetchMacroGroupData(to);
        break;
    }

    store.dispatch('group/setActiveGroup', { sg });
}

/**
 * Fetch Group data based on route params
 *
 * @return a valid 'group/ActiveGroup' element
 */
export async function fetchGroupData(to: Route): Promise<Group | null> {
    const {id, group, lang} = to.params;

    // Home > Group
    if (undefined !== id) {
        const groups = store.getters['group/groups'];
        if (undefined !== group && undefined === groups[group]) {
        store.dispatch('showLoader');
        await store.dispatch('group/fetchGroupsByMacroGroupId', { id, locale: lang });
        store.dispatch('hideLoader');
        }
        const activeGroup: Group = groups[group || id];
        await activeGroup.fetchProjects();
        return activeGroup;
    }
    return null;
}

/**
 * Fetch MacroGroup data based on route params
 *
 * @return a valid 'group/ActiveGroup' element
 */
export async function fetchMacroGroupData(to: Route): Promise<Group | MacroGroup | null> {
    const { id, group } = to.params;

    // Home > MacroGroup
    if (!group && id) {
        const macroGroups = store.getters['group/macroGroups'];
        await (macroGroups[id] as MacroGroup).fetchGroups();
        return macroGroups[id];
    } else if (group) {
        return await fetchGroupData(to);
    }
    return null;
}
