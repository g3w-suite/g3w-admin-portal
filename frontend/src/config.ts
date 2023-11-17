const window = globalThis as any;

const config  =  {

  favicon:    process.env.VUE_APP_FAVICON || window.PORTAL_FAVICON,

  theme:      window.PORTAL_THEME || process.env.VUE_APP_CSS_THEME,

  languages:  (process.env.VUE_APP_LANGUAGES ?? '').split(', '),

  admin_root: process.env.VUE_APP_ADMIN_ROOT ?? '',

  api_base_url: window.API_BASE_URL || process.env.VUE_APP_API_BASE_URL,

  /**
   * NB You should set your Authorization to 'JWT', not Bearer!!!
   *
   * @type { 'cookie' | 'Bearer' | 'JWT' }
   *
   * @see https://django-rest-framework-simplejwt.readthedocs.io/en/stable/settings.html#auth-header-types
   */
  auth_mode: window.PORTAL_AUTH_MODE || process.env.VUE_APP_AUTH_MODE,

  /**
   * @link https://v3.router.vuejs.org/guide/essentials/history-mode.html#example-server-configurations
   * @type { "history" | "hash" | "abstract" }
   */
  router_mode: window.PORTAL_HISTORY_MODE ?? process.env.VUE_APP_HISTORY_MODE,

  max_home_articles: window.PORTAL_MAX_HOME_ARTICLES ?? process.env.VUE_APP_MAX_HOME_ARTICLES ?? 6,

  /** @deprecated */
  portal_sections: [ 'maps', 'info' ],

  /** @deprecated */
  admin_btn: true,

  /** @deprecated */
  // stylesheet: process.env.VUE_APP_CSS_URL,

  /** @deprecated */
  // color:      (window as any).color || process.env.VUE_APP_CSS_COLOR,

};

export default config;
