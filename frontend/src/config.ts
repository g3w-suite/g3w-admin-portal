const config  =  {
  favicon:    'https://www.comune.altamura.ba.it/templates/shaper_helixultimate/favicon.ico',
  stylesheet: 'https://unpkg.com/@picocss/pico@1.5.6/css/pico.min.css',
  theme:      (window as any).theme || 'light',
  languages:  ['it', 'en'],
  /** @deprecated */
  portal_sections: [ 'maps', 'info' ],
  /** @deprecated */
  admin_btn: true,
};

export default config;