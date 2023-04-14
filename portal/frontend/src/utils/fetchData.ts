import store from '@/store';

/**
 * Fetch some general application data
 */
export default async function fetchData(locale: string) {
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
