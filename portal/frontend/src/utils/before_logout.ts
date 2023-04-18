import { i18n as locale} from '@/main';
import store from '@/store';
import { Route } from 'vue-router';

export default function before_logout(to?: Route, from?: Route, next = (() => {})) {
  // redirect to custom logout page
  const { logout_url, login_url } = store.getters['info/info'];
  if ('login' !== login_url) {
    location.href = logout_url;
    return false;
  }
  // default logout
  store.dispatch('me/logout', { locale });
  next();
}