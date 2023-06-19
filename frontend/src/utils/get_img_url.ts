import config from '@/config';

/**
 * Return absolute URL to G3W-ADMIN server.
 */
export function get_img_url(src: string): string {
  if (import.meta.env.PROD || src.indexOf('://') > 0 || src.indexOf('//') === 0 ) {
    return src;
  }
  return new URL(src, config.api_base_url).href;
}
