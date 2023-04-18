import config from '@/config';
import store from '@/store';

/**
 * Return absolute URL to G3W-ADMIN server.
 */
export default function get_admin_url(folder: string): string {

  // Concatenate `folder` path wihtout leading slash
  const url = new URL(config.api_base_url.replace(/^\//, '') + '/' + folder.replace(/^\//, ''));

  return url.toString();

}
