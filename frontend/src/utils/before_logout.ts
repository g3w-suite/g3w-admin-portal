import { Route } from 'vue-router';
import { useAuthStore, useInfoStore } from '@/stores';

export default function before_logout(to?: Route, from?: Route, next = (() => {})) {
  // redirect to custom logout page
  const { logout_url, login_url } = useInfoStore().info;
  if ('login' !== login_url) {
    location.href = logout_url;
    return false;
  }
  // default logout
  useAuthStore().logout();
  next();
}
