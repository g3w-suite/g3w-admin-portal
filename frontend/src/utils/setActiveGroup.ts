import router from '@/router';
import { Group } from '@/types/TGroup';
import { MacroGroup } from '@/types/TMacroGroup';
import { fetchGroupData, fetchMacroGroupData } from '@/utils';
import { Route } from 'vue-router';
import { useGroupStore } from '@/stores';

/**
 * Make sure that 'group/ActiveGroup' getter is always set after each route change
 */
export default async function setActiveGroup(to: Route) {
  let sg: Group | MacroGroup | null | false = null;

  switch (to.name) {
    case 'group':
      sg = await fetchGroupData(to);
      break;
    case 'organization':
      sg = await fetchMacroGroupData(to);
      break;
  }
  // Redirect users to 404 page when they to visit an inexistent
  // group URL (also applies to unauthenticated user sessions)
  if (false === sg) {
    router.push({name: '404', params: router.currentRoute.params });
  } else {
    useGroupStore().setActiveGroup(sg);
  }
}
