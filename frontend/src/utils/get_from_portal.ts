import { HTTPCLIENT as axios } from '@/utils';
import { useRootStore } from '@/stores';

/**
 * Retrieve data from remote G3W-ADMIN-PORTAL endpoint (eg. `/en/portal/<path_to_subfolder>`).
 */
export async function get_from_portal<T>(path_to_subfolder: string): Promise<T> {
  return axios.get<T>(useRootStore().locale + '/portal' + path_to_subfolder);
}