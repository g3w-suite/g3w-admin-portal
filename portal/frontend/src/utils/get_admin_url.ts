import config from '@/config';
import store from '@/store';

/**
 * Return absolute URL to G3W-ADMIN server.
 */
export default function get_admin_url(folder: string): string {

  // Concatenate `folder` path wihtout leading slash
  const url = new URL(config.api_base_url + folder.replace(/^\//, ''));

  // Sets rest_framework authtoken, required by `portal.middleware.AuthByDRFTokenMiddleware`
  const { drf_token } = store.getters['me/me'];
  if (drf_token) {
    url.searchParams.set('__drftk', drf_token);
  }

  return url.toString();

}
