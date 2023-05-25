import { Group } from '@/types/TGroup';
import { Route } from 'vue-router';

import { useRootStore, useGroupStore } from '@/stores';

/**
 * Fetch Group data based on route params
 *
 * @return a valid 'group/ActiveGroup' element
 */
export default async function fetchGroupData(to: Route): Promise<Group | null | false> {
  const { id, group, lang } = to.params;

  // Home > Group
  if (undefined !== id) {
    const groups = useGroupStore().groups;
    if (undefined !== group && undefined === groups[group]) {
      useRootStore().showLoader();
      await useGroupStore().fetchGroupsByMacroGroupId(lang, id);
      useRootStore().hideLoader();
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
