import { IHttpClient, httpClient as HTTPCLIENT } from '@/utils';
import { useLangStore } from '@/stores';

/**
 * Retrieve data from remote G3W-ADMIN-PORTAL endpoint (eg. `/en/portal/<path_to_subfolder>`).
 */
export async function get_from_portal<T>(path_to_subfolder: string, axios: IHttpClient = HTTPCLIENT): Promise<T> {
  return axios.get<T>(useLangStore().locale + '/portal' + path_to_subfolder);
}