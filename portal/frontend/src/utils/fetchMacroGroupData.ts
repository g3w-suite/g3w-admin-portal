import store from '@/store';
import { Group } from '@/types/TGroup';
import { MacroGroup } from '@/types/TMacroGroup';
import { fetchGroupData } from '@/utils';
import { Route } from 'vue-router';

/**
 * Fetch MacroGroup data based on route params
 *
 * @return a valid 'group/ActiveGroup' element
 */
export default async function fetchMacroGroupData(to: Route): Promise<Group | MacroGroup | null | false> {
  const { id, group } = to.params;

  // Home > MacroGroup
  if (!group && id) {
    const macroGroups = store.getters['group/macroGroups'];
    const macrogroup  = macroGroups[id];
    if (!macrogroup) { // inexistent group ID or unauthenticated user
      return false;
    }
    await (macrogroup as MacroGroup).fetchGroups();
    return macrogroup;
  } else if (group) {
    return await fetchGroupData(to);
  }
  return null;
}
