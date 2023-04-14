import store from '@/store';
import { Group } from '@/types/TGroup';
import { MacroGroup } from '@/types/TMacroGroup';
import { fetchGroupData, fetchMacroGroupData } from '@/utils';
import { Route } from 'vue-router';

/**
 * Make sure that 'group/ActiveGroup' getter is always set after each route change
 */
export default async function setActiveGroup(to: Route) {
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
