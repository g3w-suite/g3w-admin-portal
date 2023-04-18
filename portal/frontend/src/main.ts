import '@fontsource/titillium-web/400-italic.css';
import '@fontsource/titillium-web/400.css';
import '@fontsource/titillium-web/700-italic.css';
import '@fontsource/titillium-web/700.css';
import 'vite/modulepreload-polyfill';

import App from '@/App.vue';
import config from '@/config';
import '@/icons';
import { en } from '@/locale/en';
import { it } from '@/locale/it';
import router from '@/router';
import store from '@/store';
import Vue from 'vue';
import Fragment from 'vue-fragment';
import VueI18n from 'vue-i18n';

// Reset all cookies while developing
if (document.cookie && 'development' === (import .meta as any).env.MODE) {
  console.log(`Clearing document.cookie: "${document.cookie}"`);
  document.cookie.split(';').forEach((c) => {
    document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
  });
}

// if (config.stylesheet) {
//   const css = document.createElement('link');
//   css.setAttribute('rel', 'stylesheet');
//   css.setAttribute('href', config.stylesheet);
//   document.body.appendChild(css);
// }

// if (config.color) {
//   document.documentElement.setAttribute('data-color', config.color);
//   document.documentElement.style.setProperty('--custom-color', config.color);
//   document.documentElement.style.setProperty('--header-color', config.color);
//   document.documentElement.style.setProperty(
//     '--header-color-alt',
//     process.env.VUE_APP_CSS_COLOR_ALT || config.color
//   );
// }

if (config.theme) {
  document.documentElement.setAttribute('data-theme', config.theme);
}

if (config.favicon) {
  const icon = document.querySelector('link[rel~=\'icon\']') || document.createElement('link');
  icon.setAttribute('rel', 'icon');
  icon.setAttribute('href', config.favicon);
}

Vue.use(Fragment.Plugin);
Vue.use(VueI18n);

Vue.config.productionTip = false;

export const i18n = new VueI18n({ locale: 'it', fallbackLocale: 'it', messages: { it, en } });

new Vue({
  router,
  store,
  i18n,
  render: (h) => h(App),
  created: () => {
    store.dispatch('info/fetchInfo', { locale: i18n.locale });
    store.dispatch('settings/portalSections', { sections: config.portal_sections });
    store.dispatch('settings/showAdminButton', { show: config.admin_btn });
    store.dispatch('settings/fetchPictures', { locale: i18n.locale });
  },
}).$mount('#app');
