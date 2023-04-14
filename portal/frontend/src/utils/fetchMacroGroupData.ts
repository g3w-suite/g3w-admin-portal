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
