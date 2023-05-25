import { useInfoStore, useSettingsStore, useGroupStore, useRootStore } from '@/stores';

/**
 * Fetch some general application data
 */
export default async function fetchData() {
  useRootStore().showLoader();
  await Promise.allSettled([
    useInfoStore().fetchInfo(),
    useSettingsStore().fetchPictures(),
    useGroupStore().fetchMacroGroups(),
    useGroupStore().fetchGroupsWithNoMacroGroup(),
    useGroupStore().fetchProjects(),
  ]);
  useRootStore().hideLoader();
}
