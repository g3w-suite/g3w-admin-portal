import store from '@/store';
import { Group } from '@/types/TGroup';
import { Route } from 'vue-router';

/**
 * Fetch Group data based on route params
 *
 * @return a valid 'group/ActiveGroup' element
 */
export default async function fetchGroupData(to: Route): Promise<Group | null | false> {
  const { id, group, lang } = to.params;

  // Home > Group
  if (undefined !== id) {
    const groups = store.getters['group/groups'];
    if (undefined !== group && undefined === groups[group]) {
      store.dispatch('showLoader');
      await store.dispatch('group/fetchGroupsByMacroGroupId', { id, locale: lang });
      store.dispatch('hideLoader');
    }
    const activeGroup: Group = groups[group || id];
    if (!activeGroup) {
      return false; // inexistent group ID or unauthenticated user
    }
    await activeGroup.fetchProjects();
    return activeGroup;
  }
  return null;
}
