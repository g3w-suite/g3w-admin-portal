import 'vite/modulepreload-polyfill';

import "dialog-polyfill/dist/dialog-polyfill.css";
import '@picocss/pico/css/pico.css';
import '@fontsource/titillium-web/400-italic.css';
import '@fontsource/titillium-web/400.css';
import '@fontsource/titillium-web/700-italic.css';
import '@fontsource/titillium-web/700.css';

import Vue from 'vue';

/** @TODO */
// import './_version';

import config from '@/config';
import '@/icons';

import i18n from '@/i18n';
import store from '@/store';
import router from '@/router';

import { fetchData, setActiveGroup } from '@/utils';

import App from '@/App.vue';

if (config.theme) {
  document.documentElement.setAttribute('data-theme', config.theme);
}

if (config.favicon) {
  const icon = document.querySelector('link[rel~=\'icon\']') || document.createElement('link');
  icon.setAttribute('rel', 'icon');
  icon.setAttribute('href', config.favicon);
}

/**
 * Refresh data on user Login / Logout
 */
store.subscribe(async (mutation, state) => {
  if (mutation.type === 'me/setUser') {
    console.log('reset');
    // disgread JWT tokens after calling: commit('setUser', null)
    const me = store.getters['me/me'];
    if (!state.useCookies && ! me) {
      await store.dispatch('removeTokens', undefined);
    }
    // fetch again data from server 
    await store.dispatch('group/reset');
    await fetchData(i18n.global.locale);
    await setActiveGroup(router.currentRoute);
  }
});

(Vue as any).Portal = Vue.createApp(App)
  .use(i18n)
  .use(store)
  .use(router)
  .mount('#app');

(globalThis as any).Vue = Vue;
