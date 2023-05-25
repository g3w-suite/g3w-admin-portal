import 'vite/modulepreload-polyfill';

import "dialog-polyfill/dist/dialog-polyfill.css";
import '@picocss/pico/css/pico.css';
import '@fontsource/titillium-web/400-italic.css';
import '@fontsource/titillium-web/400.css';
import '@fontsource/titillium-web/700-italic.css';
import '@fontsource/titillium-web/700.css';

import Vue from 'vue';
import { createPinia } from 'pinia';
import { useRootStore, useAuthStore, useGroupStore, useLangStore } from '@/stores';

/** @TODO */
// import './_version';

import config from '@/config';
import '@/icons';

import i18n from '@/i18n';
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

const pinia = createPinia();


const app = (Vue as any).Portal = Vue.createApp(App)
  .use(i18n)
  .use(pinia)
  .use(router);

(globalThis as any).Vue = Vue;


/**
 * Refresh data on user Login / Logout
 */
useAuthStore().$onAction((action) => {
  if (action.name === 'setUser') {
    action.after(async(d) => {
      console.log('reset');
      // disgread JWT tokens after calling: commit('setUser', null)
      const { me } = useAuthStore();
      const { useCookies } = useRootStore();
      if (!useCookies && ! me) {
        await  useRootStore().removeTokens();
      }
      // fetch again data from server 
      await useGroupStore().reset();
      await fetchData();
      await setActiveGroup(router.currentRoute);
    });
  }
});


app.mount('#app');