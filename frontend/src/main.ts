import 'vite/modulepreload-polyfill';

import "dialog-polyfill/dist/dialog-polyfill.css";
import '@picocss/pico/css/pico.css';
import '@fontsource/titillium-web/400-italic.css';
import '@fontsource/titillium-web/400.css';
import '@fontsource/titillium-web/700-italic.css';
import '@fontsource/titillium-web/700.css';

import * as Vue from 'vue';

/** @TODO */
// import './_version';

import config from '@/config';
import { FontAwesomeIcon, i18n, router, pinia, breadcrumbs } from '@/plugins';
import App from '@/App.vue';


if (config.theme) {
  document.documentElement.setAttribute('data-theme', config.theme);
}

if (config.favicon) {
  const icon = document.querySelector('link[rel~=\'icon\']') || document.createElement('link');
  icon.setAttribute('rel', 'icon');
  icon.setAttribute('href', config.favicon);
}

const app = Vue
  .createApp(App)
  .use(i18n)
  .use(pinia)
  .use(router)
  .use(breadcrumbs)
  .component('font-awesome-icon', FontAwesomeIcon);

// (Vue as any).app = app;
// (globalThis as any).Vue = Vue;

app.mount('#app');

// customElements.define(
//   'g3w-portal',
//   createElementInstance({
//     component: App,
//     // props: { title: String },
//     sharedStoreInstance: true,
//     plugins: [i18n, pinia, router],
//     components: {
//       'font-awesome-icon': FontAwesomeIcon
//     },
//     renderOptions: { ref: 'component' }
//   })
// );