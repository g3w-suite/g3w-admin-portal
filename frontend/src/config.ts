import { RouterMode } from 'vue-router';

const config  =  {
  favicon:    process.env.VUE_APP_FAVICON,
  stylesheet: process.env.VUE_APP_CSS_URL,
  theme:      (window as any).theme || process.env.VUE_APP_CSS_THEME,
  languages:  process.env.VUE_APP_LANGUAGES.split(', '),
  /** @deprecated */
  portal_sections: [ 'maps', 'info' ],
  /** @deprecated */
  admin_btn: true,
  admin_url: process.env.VUE_APP_ADMIN_URL,
  /** @link https://v3.router.vuejs.org/guide/essentials/history-mode.html#example-server-configurations */
  router_mode: (process.env.VUE_APP_HISTORY_MODE as RouterMode),
};

export default config;
