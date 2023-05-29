import { HTTPCLIENT, IHttpClient } from '@/utils';
import { useRootStore } from '@/stores';

/**
 * Retrieve data from remote G3W-ADMIN-PORTAL endpoint (eg. `/en/portal/<path_to_subfolder>`).
 */
export async function get_from_portal<T>(path_to_subfolder: string, axios: IHttpClient = HTTPCLIENT): Promise<T> {
  return axios.get<T>(useRootStore().locale + '/portal' + path_to_subfolder);
}