import { RouterMode } from "vue-router";

const config  =  {
  /** @TODO remove it or replace with custom favicon url */
  favicon:    'https://www.comune.altamura.ba.it/templates/shaper_helixultimate/favicon.ico',
  /** @TODO remove it or replace with local css url */
  stylesheet: 'https://unpkg.com/@picocss/pico@1.5.6/css/pico.min.css',
  theme:      (window as any).theme || 'light',
  languages:  ['it', 'en'],
  /** @deprecated */
  portal_sections: [ 'maps', 'info' ],
  /** @deprecated */
  admin_btn: true,
  admin_url: 'http://127.0.0.1:8000',
  /** @link https://v3.router.vuejs.org/guide/essentials/history-mode.html#example-server-configurations */
  router_mode: ('history' as RouterMode)
};

export default config;
