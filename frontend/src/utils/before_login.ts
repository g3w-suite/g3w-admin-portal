import store from '@/store';
import { Route } from 'vue-router';

export default function before_login(to?: Route, from?: Route, next = (() => {})) {
  // redirect to custom login page
  const { login_url } = store.getters['info/info'];
  if ('login' !== login_url) {
    location.href = login_url;
    return false;
  }
  // default login
  next();
}
