import config from '@/config';
import { get_admin_url } from '@/utils';
import { Route } from 'vue-router';

export default function before_admin(to?: Route, from?: Route, next = (() => {})) {
  // redirect to admin dashboard page
  location.href = get_admin_url(config.admin_root);
}
