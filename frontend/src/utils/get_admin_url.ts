import config from '@/config';

/**
 * Return absolute URL to G3W-ADMIN server.
 */
export function get_admin_url(folder: string): string {
  return new URL(folder, config.api_base_url).href;
}
