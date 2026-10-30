(() => {
  const portal = {
    scriptURL: document.currentScript.src,
    base: new URL(window.API_BASE_URL || '/', location.href),
    languages: window.LANGUAGES || ['en', 'it'],
    auth: window.PORTAL_AUTH_MODE || 'cookie',
    refreshRequest: undefined,
    mode: window.PORTAL_HISTORY_MODE || 'hash',
    locale: '',
    info: {},
    pictures: [],
    macros: [],
    groups: [],
    allGroups: [],
    projects: [],
    user: null,
    search: '',
    view: { page: {} },
    navigation: 0,
    carousel: undefined,
    memoryPath: '/',
    messages: {},
    get tokenAuth() {
      return ['JWT', 'Bearer'].includes(this.auth);
    },
    get routePrefix() {
      return this.mode === 'hash' ? '#' : '';
    },
    get top() {
      return window.PORTAL_NAVBAR_TOP !== false;
    },
    get menu() {
      return this.top || window.PORTAL_MENU_BUTTON !== false;
    },
    get orgName() {
      return window.PORTAL_ORG_NAME || this.info.suite_org_name || '';
    },
    get orgImage() {
      return window.PORTAL_ORG_IMAGE || this.info.suite_org_image;
    },
    get orgURL() {
      return window.PORTAL_ORG_URL || this.info.suite_org_url;
    },
    get route() {
      const url = new URL({ abstract: this.memoryPath, hash: location.hash.slice(1) || '/' }[this.mode] ?? location.pathname + location.search, location.origin);
      const parts = url.pathname.split('/').filter(Boolean);
      const locale = this.languages.includes(parts[0]) ? parts.shift() : [navigator.language.split('-')[0], 'en', this.languages[0]].find(lang => this.languages.includes(lang));
      const [name = 'home', id, group, ...extra] = parts;
      const valid = ['home', 'login', 'logout', 'admin', 'search', 'group', 'organization', 'map'].includes(name) && !extra.length && (name === 'organization' || !group) && (['organization', 'group', 'map'].includes(name) || !id);
      return { locale, name: valid ? name : '404', id, group, path: `/${locale}/${parts.join('/')}${url.search}`, query: url.searchParams };
    },
    get logo() {
      return `<img class="logo" src="${this.escape(this.info.suite_logo && !this.info.suite_logo.endsWith('/') ? this.safeURL(this.info.suite_logo) : new URL('assets/logo_g3wsuite-bw.png', this.scriptURL).href)}" alt="${this.escape(this.info.title)}">`;
    },
    get org() {
      return this.orgImage ? `<img class="logo" src="${this.escape(this.safeURL(this.orgImage))}" alt="${this.escape(this.orgName)}">` : this.escape(this.orgName);
    },
    get locales() {
      return this.languages.map(locale => ({
        locale,
        name: new Intl.DisplayNames([locale], { type: 'language' }).of(locale === 'se' ? 'sv' : locale)?.replace(/^./, str => str.toUpperCase()),
        flag: `<img class="flag" src="${new URL(`../img/flags/${locale}.png`, this.scriptURL).href}" alt="" width="18" height="12"> `,
      }));
    },
    get language() {
      return this.locales.find(item => item.locale === this.route.locale);
    },
    get title() {
      return {
        home:         'Home',
        login:        this.t('Login'),
        search:       this.t('Search'),
        map:          this.t('Search'),
        group:        this.view.page.id ? this.view.group?.title || this.view.group?.name : this.t('Groups'),
        organization: this.view.page.id ? (this.view.macro && !this.view.page.group ? this.view.macro.title : this.view.group?.title || this.view.group?.name) : this.t('Organizations'),
      }[this.view.page.name] || this.t('Page Not Found');
    },
    get cards() {
      return {
        home:         [...this.groups.map(item => [item, false]), ...this.macros.map(item => [item, true])],
        group:        !this.view.page.id && [...this.groups.map(item => [item, false]), ...this.macros.map(item => [item, true])],
        organization: this.view.page.id ? this.view.macro && !this.view.page.group && this.view.groups.map(item => [item, false]) : this.macros.map(item => [item, true]),
      }[this.view.page.name];
    },
    get max() {
      const limit = Number(window.PORTAL_MAX_HOME_ARTICLES ?? 6);
      return this.view.page.name === 'home' && Number.isFinite(limit) && limit >= 0 ? limit : this.cards?.length;
    },
    async fetch(path, { method = 'GET', body, retry = true } = {}) {
      if (path.startsWith('/authjwt/') && portal.base.origin === location.origin && portal.base.pathname.endsWith('/proxy/')) {
        path = path.slice(1);
      }
      const headers = { Accept: 'application/json' };
      if (body !== undefined) {
        headers['Content-Type'] = body instanceof URLSearchParams ? 'application/x-www-form-urlencoded' : 'application/json';
      }
      const access = portal.tokenAuth && localStorage.getItem('access_token');
      if (access) {
        headers.Authorization = `${portal.auth} ${access}`;
      }
      if (method !== 'GET' && new URL(path, portal.base).origin === location.origin) {
        const cookie = document.cookie.split('; ').find(item => item.startsWith('csrftoken='));
        if (cookie) headers['X-CSRFToken'] = decodeURIComponent(cookie.slice('csrftoken='.length));
      }
      const response = await fetch(new URL(path, portal.base).href, {
        method,
        headers,
        credentials: portal.tokenAuth ? 'same-origin' : 'include',
        body:        body instanceof URLSearchParams ? body.toString() : JSON.stringify(body),
      });
      const expired = portal.tokenAuth && retry && [401, 403].includes(response.status) && !path.includes('/authjwt/') && localStorage.getItem('refresh_token');
      if (expired && access === localStorage.getItem('access_token')) {
        await (portal.refreshRequest ??= portal.fetch('/authjwt/api/token/refresh/', {
          method: 'POST',
          retry: false,
          body: {
            refresh: localStorage.getItem('refresh_token')
          },
        }).then(data => {
          if (typeof data.access !== 'string' || !data.access) throw new Error('Invalid token refresh response');
          localStorage.setItem('access_token', data.access);
          const refresh = data.refresh || localStorage.getItem('refresh_token');
          if (!refresh) {
            localStorage.removeItem('refresh_token');
            return;
          }
          localStorage.setItem('refresh_token', refresh);
        }).catch(error => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          throw error;
        }).finally(() => { portal.refreshRequest = undefined; }));
      }
      if (expired) return portal.fetch(path, { method, body, retry: false });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${path}`);
      }
      if (response.status === 204) return null;
      return response.json();
    },
    async login(locale, username, password) {
      if (portal.tokenAuth) {
        const data = await portal.fetch('/authjwt/api/token/', { method: 'POST', body: { username, password }, retry: false });
        if (typeof data.access !== 'string' || !data.access || typeof data.refresh !== 'string' || !data.refresh) throw new Error('Invalid authentication response');
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        return;
      }
      const data = await portal.fetch(`${locale}/portal/jx/login/`, {
        method: 'POST', body: new URLSearchParams({ username, password }),
      });
      if (data.status !== 'ok') throw new Error(Object.values(data.errors_form || data.error_form || {}).flat().join(' ') || 'Login failed');
    },
    async logout() {
      const { locale, name } = portal.route;
      const user = portal.user;
      if (portal.info.login_url && portal.info.login_url !== 'login' && portal.info.logout_url && !['logout', 'login'].includes(portal.info.logout_url)) {
        return location.assign(portal.safeURL(portal.info.logout_url));
      }
      const data = portal.tokenAuth
        ? await portal.fetch('/authjwt/api/token/blacklist/', { method: 'POST', body: { refresh: localStorage.getItem('refresh_token') }, retry: false })
        : await portal.fetch(`${locale}/portal/jx/logout/`);
      if (!portal.tokenAuth && data.status !== 'ok') {
        throw new Error(data.message || 'Logout failed');
      }
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      if (portal.tokenAuth && user?.drf_token) {
        const url = new URL(`${locale}/portal/jx/logout/`, portal.base);
        url.search = new URLSearchParams({ __drftk: user.drf_token, redirect: location.href });
        location.assign(url.href);
      }
      portal.user = null;
      portal.locale = '';
      portal.projects = [];
      portal.groups = [];
      portal.allGroups = [];
      portal.macros = [];
      portal.visibleProjects = [];
      clearInterval(portal.carousel);
      document.documentElement.classList.remove('modal-is-open');
      document.querySelectorAll('[data-portal-ui], #app').forEach(element => element.remove());
      document.body.insertAdjacentHTML('beforeend', '<main id="content" class="container" data-portal-ui><progress aria-label="Loading"></progress></main>');
      Object.assign(portal, await portal.fetch(`${locale}/portal/api/catalog/`), { locale });
      if (name === 'logout') {
        portal.memoryPath = `/${locale}/`;
      }
      if (name === 'logout' && portal.mode !== 'abstract') {
        history.replaceState({}, '', portal.routePrefix + portal.memoryPath);
      }
      await portal.render();
    },

    escape(value) {
      return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
    },

    t(key) {
      return portal.messages[key] ?? key;
    },

    safeURL(value, base = portal.base) {
      if (!value) return '';
      const url = new URL(value, base);
      return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : '';
    },

    async whoami(locale) {
      const user = await portal.fetch(`${locale}/portal/api/whoami/`);
      if (portal.auth === 'cookie' || !user.is_authenticated) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
      return user.is_authenticated ? user : null;
    },

    async render() {
      const version = ++portal.navigation;
      const page = portal.route;
      try {
        if (portal.locale !== page.locale) {
          const locale = ['en', 'it', 'fr', 'de', 'bg', 'fi', 'pt', 'ro', 'se'].includes(page.locale) ? page.locale : 'en';
          const [translation, data, user] = await Promise.all([
            locale === 'en' ? {} : import(`./locale/${locale}.js`),
            portal.fetch(`${page.locale}/portal/api/catalog/`),
            portal.whoami(page.locale),
          ]);
          if (version !== portal.navigation) return;
          portal.messages = translation.default || {};
          Object.assign(portal, data, { user, locale: page.locale });
        }
        const url = new URL(location.href);
        const next = portal.user && url?.searchParams?.get?.('next');
        if (next && (!next.startsWith('/') || new URL(next, location.origin).origin !== location.origin)) {
          throw new Error('Invalid return path');
        }
        if (next) {
          url.searchParams.delete('next');
          history.replaceState({}, '', url);
          portal.memoryPath = next;
          if (portal.mode !== 'abstract') history.replaceState({}, '', portal.routePrefix + next);
          return portal.render();
        }
        if (page.name === 'admin') {
          location.assign(new URL(window.PORTAL_ADMIN_ROOT ?? '/admin', portal.base).href);
          return;
        }
        if (page.name === 'logout') return portal.logout();
        if (page.name === 'login' && portal.info.login_url && portal.info.login_url !== 'login') {
          location.assign(portal.safeURL(portal.info.login_url));
          return;
        }
        const macro = page.name === 'organization' && page.id ? portal.macros.find(item => String(item.id) === page.id) : null;
        const scoped = ['group', 'organization'].includes(page.name) && page.id;
        const groups = scoped && (page.name !== 'organization' || macro) ? (macro ? await portal.fetch(`${page.locale}/portal/api/group/${page.id}`) : portal.allGroups) : undefined;
        const group = (!macro || page.group) && groups?.find(item => String(item.id) === (page.group || page.id));
        const items = group ? await portal.fetch(`${page.locale}/portal/api/group/${group.id}/projects/`) : undefined;
        if (items) portal.visibleProjects = items;
        if (version !== portal.navigation) return;
        if (scoped && !portal.user && !(macro && !page.group) && !group) {
          portal.memoryPath = `/${page.locale}/login?${new URLSearchParams({ next: page.path })}`;
          if (portal.mode !== 'abstract') history.replaceState({}, '', portal.routePrefix + portal.memoryPath);
          return portal.render();
        }
        document.documentElement.lang = page.locale;
        document.documentElement.dataset.theme = window.PORTAL_THEME || 'light';
        document.body.classList.remove('home', 'login', 'search', 'group', 'organization', 'map', '404');
        document.body.classList.add(page.name);
        portal.view = { page, macro, groups, group };
        document.title = `${portal.title} - ${portal.info.title || 'G3W-SUITE'}`;
        if (portal.mode === 'hash' && !location.hash) history.replaceState({}, '', portal.routePrefix + page.path);

        const picture = portal.pictures[0];
        const template = document.createElement('template');
        template.innerHTML = /* html */`
          <button type="button" class="skip-link" data-skip-content>Skip to content</button>
          ${portal.top ? '<nav id="top-menu" class="container-fluid top-menu"><ul><li class="nav-org">' : ''}
          ${portal.top && portal.orgURL ? `<a href="${portal.escape(portal.safeURL(portal.orgURL))}" title="${portal.escape(window.PORTAL_ORG_TITLE || '')}">${portal.org}</a>` : ''}
          ${portal.top && !portal.orgURL ? portal.org : ''}
          ${portal.top ? `</li></ul><ul>${portal.user ? `<li class="nav-admin"><a href="${portal.escape(portal.routePrefix + `/${page.locale}/admin`)}" data-route="${portal.escape(`/${page.locale}/admin`)}" aria-label="${portal.escape(portal.t('Admin'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/></svg><span class="hide-on-mobile">${portal.escape(portal.t('Admin'))}</span></a></li><li class="nav-logout"><a href="${portal.escape(portal.routePrefix + `/${page.locale}/logout`)}" data-logout aria-label="${portal.escape(portal.t('Logout'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M9 3H3v18h6M9 12h13m-5-5 5 5-5 5"/></svg><span class="hide-on-mobile">${portal.escape(portal.t('Logout'))}</span></a></li>` : `<li class="nav-login"><a href="${portal.escape(portal.routePrefix + `/${page.locale}/login`)}" data-route="${portal.escape(`/${page.locale}/login`)}" aria-label="${portal.escape(portal.t('Login'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5Z" fill="none" stroke="currentColor"></path></svg><span class="hide-on-mobile">${portal.escape(portal.t('Login'))}</span></a></li>`}<li class="nav-lang"><a href="#language" ${window.PORTAL_LANG_BUTTON ? 'data-language-toggle' : 'data-languages aria-haspopup="dialog"'} aria-label="${portal.escape(portal.t('Choose a language'))}">${portal.language.flag}<span${portal.language.flag ? ' class="hide-on-mobile"' : ''}>${portal.escape(portal.language.name)}</span></a></li></ul></nav>` : ''}
          <nav id="main-menu" class="container-fluid main-menu${!portal.top && !portal.menu ? ' compact' : ''}${!portal.top && portal.menu ? ' mobile-menu' : ''}">
            <ul>
              <li class="nav-logo">
                ${portal.info.url_suite_logo ? `<a href="${portal.escape(portal.safeURL(portal.info.url_suite_logo))}" aria-label="Back home">${portal.logo}</a>` : `<a href="${portal.escape(portal.routePrefix + `/${page.locale}/`)}" data-route="${portal.escape(`/${page.locale}/`)}" aria-label="Back home">${portal.logo}</a>`}
              </li>
              <li class="nav-title hide-on-mobile">
                <span class="h1">${portal.escape(portal.info.title)}</span><span>${portal.escape(portal.info.sub_title)}</span>
              </li>
            </ul>
            <ul>
              <li class="nav-search"><a href="${portal.escape(portal.routePrefix + `/${page.locale}/search`)}" data-route="${portal.escape(`/${page.locale}/search`)}" title="${portal.escape(portal.t('Find a map in the catalog'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="7"/><path d="m15 15 7 7"/></svg>${portal.escape(portal.t('Search'))}</a></li>
              ${!portal.top ? `${portal.user ? `<li class="nav-admin"><a href="${portal.escape(portal.routePrefix + `/${page.locale}/admin`)}" data-route="${portal.escape(`/${page.locale}/admin`)}" aria-label="${portal.escape(portal.t('Admin'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/></svg><span class="hide-on-mobile">${portal.escape(portal.t('Admin'))}</span></a></li><li class="nav-logout"><a href="${portal.escape(portal.routePrefix + `/${page.locale}/logout`)}" data-logout aria-label="${portal.escape(portal.t('Logout'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M9 3H3v18h6M9 12h13m-5-5 5 5-5 5"/></svg><span class="hide-on-mobile">${portal.escape(portal.t('Logout'))}</span></a></li>` : `<li class="nav-login"><a href="${portal.escape(portal.routePrefix + `/${page.locale}/login`)}" data-route="${portal.escape(`/${page.locale}/login`)}" aria-label="${portal.escape(portal.t('Login'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5Z" fill="none" stroke="currentColor"></path></svg><span class="hide-on-mobile">${portal.escape(portal.t('Login'))}</span></a></li>`}<li class="nav-lang"><a href="#language" ${window.PORTAL_LANG_BUTTON ? 'data-language-toggle' : 'data-languages aria-haspopup="dialog"'} aria-label="${portal.escape(portal.t('Choose a language'))}">${portal.language.flag}<span${portal.language.flag ? ' class="hide-on-mobile"' : ''}>${portal.escape(portal.language.name)}</span></a></li>` : ''}
              ${portal.menu && !portal.top ? '<li class="nav-toggle show-on-mobile">' : ''}
              ${portal.menu && portal.top ? '<li class="nav-toggle">' : ''}
              ${portal.menu ? `<button type="button" class="outline contrast" data-menu aria-controls="secondary-menu" aria-expanded="false">${portal.escape(portal.t('MENU'))}</button></li>` : ''}
            </ul>
            <ul id="secondary-menu" hidden>
              <li><a href="${portal.escape(portal.routePrefix + `/${page.locale}/`)}" data-route="${portal.escape(`/${page.locale}/`)}">${portal.escape(portal.t('Home'))}</a></li>
              <li><a href="${portal.escape(portal.routePrefix + `/${page.locale}/group`)}" data-route="${portal.escape(`/${page.locale}/group`)}">${portal.escape(portal.t('Groups'))}</a></li>
              ${!portal.top && portal.menu ? /* html */`<li class="show-on-mobile"><a href="${portal.escape(portal.routePrefix + `/${page.locale}/search`)}" data-route="${portal.escape(`/${page.locale}/search`)}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="7"/><path d="m15 15 7 7"/></svg>${portal.escape(portal.t('Search'))}</a></li>
                ${portal.user ? `<li class="nav-admin show-on-mobile"><a href="${portal.escape(portal.routePrefix + `/${page.locale}/admin`)}" data-route="${portal.escape(`/${page.locale}/admin`)}" aria-label="${portal.escape(portal.t('Admin'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/></svg><span>${portal.escape(portal.t('Admin'))}</span></a></li><li class="nav-logout show-on-mobile"><a href="${portal.escape(portal.routePrefix + `/${page.locale}/logout`)}" data-logout aria-label="${portal.escape(portal.t('Logout'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M9 3H3v18h6M9 12h13m-5-5 5 5-5 5"/></svg><span>${portal.escape(portal.t('Logout'))}</span></a></li>` : `<li class="nav-login show-on-mobile"><a href="${portal.escape(portal.routePrefix + `/${page.locale}/login`)}" data-route="${portal.escape(`/${page.locale}/login`)}" aria-label="${portal.escape(portal.t('Login'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5Z" fill="none" stroke="currentColor"></path></svg><span>${portal.escape(portal.t('Login'))}</span></a></li>`}
                <li class="nav-lang show-on-mobile"><a href="#language" ${window.PORTAL_LANG_BUTTON ? 'data-language-toggle' : 'data-languages aria-haspopup="dialog"'} aria-label="${portal.escape(portal.t('Choose a language'))}">${portal.language.flag}<span${portal.language.flag ? ' class="hide-on-mobile"' : ''}>${portal.escape(portal.language.name)}</span></a></li>` : ''}
            </ul>
          </nav>
          ${page.name === 'home' ? '<header id="header">' : ''}
          ${page.name === 'home' && picture ? /* html */`
            <figure id="carousel">
              <img src="${portal.escape(portal.safeURL(picture.image))}" alt="">
              <figcaption>` : ''}
          ${page.name === 'home' && picture?.author && picture.author_url ? `<a href="${portal.escape(portal.safeURL(picture.author_url))}">Photo by ${portal.escape(picture.author)}</a>` : ''}
          ${page.name === 'home' && picture?.author && !picture.author_url ? `<span>Photo by ${portal.escape(picture.author)}</span>` : ''}
          ${page.name === 'home' && picture ? '</figcaption></figure>' : ''}
          ${page.name === 'home' && portal.info.home_description ? `<div class="container" data-theme="dark">${portal.info.home_description}</div>` : ''}
          ${page.name === 'home' ? '</header>' : ''}
          <nav id="breadcrumb" class="container" aria-label="breadcrumb">
            <ul>
              <li><a href="${portal.escape(portal.routePrefix + `/${page.locale}/`)}" data-route="${portal.escape(`/${page.locale}/`)}" ${page.name === 'home' ? `aria-current="page" aria-label="${portal.escape(portal.t('Home'))}"` : ''}>${page.name === 'home' ? '' : 'Home'}</a></li>
              ${['group', 'organization'].includes(page.name) && page.id ? `<li><a href="${portal.escape(portal.routePrefix + `/${page.locale}/${page.name}`)}" data-route="${portal.escape(`/${page.locale}/${page.name}`)}">${portal.escape(portal.t(page.name === 'group' ? 'Groups' : 'Organizations'))}</a></li>` : ''}
              ${page.name === 'organization' && page.group ? `<li><a href="${portal.escape(portal.routePrefix + `/${page.locale}/organization/${page.id}`)}" data-route="${portal.escape(`/${page.locale}/organization/${page.id}`)}">${portal.escape(portal.macros.find(item => String(item.id) === page.id)?.title)}</a></li>` : ''}
              ${page.name !== 'home' ? `<li aria-current="page">${portal.escape(portal.title)}</li>` : ''}
            </ul>
          </nav>
          <main id="content" class="container" tabindex="-1">
            ${page.name === 'home'
                ? /* html */`
                  <div class="show-on-mobile">
                    <span>${portal.escape(portal.info.sub_title)}</span>
                    <h1>${portal.escape(portal.info.title)}</h1>
                  </div>
                  <hgroup>
                    <h2>${portal.escape(portal.info.groups_title)}</h2>
                    <div>${portal.info.groups_map_description}</div>
                  </hgroup>
                  `
                : ''}
              ${page.name === 'login'
                ? /* html */`
                  <article class="grid login-form">
                    <div>
                      <h2>${portal.escape(portal.info.login_title || portal.t('Login to the admin system'))}</h2>
                      <form id="login-form"><label for="username">${portal.escape(portal.t('Username'))}</label>
                        <input id="username" name="username" placeholder="${portal.escape(portal.t('Username'))}" autocomplete="username" required>
                        <label for="password">${portal.escape(portal.t('Password'))}</label>
                        <input id="password" name="password" type="password" placeholder="${portal.escape(portal.t('Password'))}" autocomplete="current-password" required>
                        <button type="submit" class="contrast">${portal.escape(portal.t('Login'))}</button>
                        ${Object.entries(portal.info.social_auth_providers || {}).map(([name, url]) => `<a href="${portal.escape(portal.safeURL(url))}" role="button" class="contrast outline social-login">${portal.escape(name)}</a>`).join('')}
                        <p id="login-error" role="alert" hidden></p>
                  `
                : ''}
              ${page.name === 'login' && portal.info.reset_password_url ? `<a href="${portal.escape(portal.safeURL(portal.info.reset_password_url))}">${portal.escape(portal.t('Forgot your password?'))}</a>` : ''}
              ${page.name === 'login' ? '</form></div>' : ''}
              ${page.name === 'login' && portal.info.login_description ? `<div>${portal.info.login_description}</div>` : ''}
              ${page.name === 'login' ? '</article>' : ''}
              ${['search', 'map'].includes(page.name)
                ? /* html */`
                  <input type="search" id="search" aria-label="${portal.escape(portal.t('Find a map in the catalog'))}" placeholder="${portal.escape(portal.t('Find a map in the catalog'))}" value="${portal.escape(portal.search)}">
                  `
                : ''}
              ${macro && !page.group
                ? /* html */`
                  <hgroup>
                    <h2>${portal.escape(macro.title || macro.name)}</h2>
                    <div>${macro.description}</div>
                  </hgroup>
                  `
                : ''}
              ${group
                ? /* html */`
                  <hgroup>
                    <h2>${portal.escape(group.title || group.name)}</h2>
                    <div>${group.description}</div>
                  </hgroup>
                  `
                : ''}
              ${portal.cards ? '<div class="grid catalog">' : ''}
              ${(portal.cards || []).slice(0, portal.max).map(([item, isMacro]) => {
                const path = macro ? `organization/${page.id}/${item.id}` : `${isMacro ? 'organization' : 'group'}/${item.id}`;
                const title = item.title || item.name || portal.t('Group');
                return /* html */`
                  <article class="${isMacro ? 'MG' : 'G'}-${portal.escape(item.id)} item-${isMacro ? 'MG' : 'G'}">
                    <a href="${portal.escape(portal.routePrefix + `/${page.locale}/${path}`)}" data-route="${portal.escape(`/${page.locale}/${path}`)}"><figure>
                      <img loading="lazy" src="${portal.escape(portal.safeURL(item.logo_img || item.header_logo_img) || new URL('assets/logo_g3wsuite.png', portal.scriptURL).href)}" alt="${portal.escape(title)}">
                      <figcaption><h3><b>${portal.escape(title)}</b></h3></figcaption>
                    </figure></a>
                  </article>`;
              }).join('')}
              ${portal.cards ? '</div>' : ''}
              ${page.name === 'home' && portal.max > 0 && portal.cards.length > portal.max ? `<div id="load-more"><a href="${portal.escape(portal.routePrefix + `/${page.locale}/group`)}" data-route="${portal.escape(`/${page.locale}/group`)}" role="button">${portal.escape(portal.t('Show all'))}</a></div>` : ''}
              ${['search', 'map'].includes(page.name) ? '<div id="search-results">' : ''}
              ${(items || portal.projects).filter(item => group || ['search', 'map'].includes(page.name) && `${item.title || ''} ${item.description || ''}`.toLowerCase().includes(portal.search.toLowerCase())).map(item => /* html */`
                <article class="grid item-P P-${portal.escape(item.id)}">
                  <div><figure><img loading="lazy" src="${portal.escape(portal.safeURL(item.thumbnail) || new URL('assets/logo_g3wsuite.png', portal.scriptURL).href)}" alt="${portal.escape(item.title)}"></figure>
                    <p><a href="${portal.escape(portal.safeURL(item.map_url))}" target="_blank" rel="noopener noreferrer"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 9V3h6m6 0h6v6m0 6v6h-6M9 21H3v-6M3 3l6 6m6 6 6 6M21 3l-6 6M9 15l-6 6"/></svg><span>${portal.escape(portal.t('View'))}</span></a>
                      ${item.ogc_urls && Object.keys(item.ogc_urls).length ? `<a href="#services" data-services="${portal.escape(item.id)}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m2 8 10-6 10 6-10 6Zm0 5 10 6 10-6M2 18l10 6 10-6"/></svg><span>${portal.escape(portal.t('Services'))}</span></a>` : ''}
                      ${portal.user && item.edit_url ? `<a href="${portal.escape(portal.safeURL(item.edit_url))}" target="_blank" rel="noopener noreferrer"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m16 3 5 5-12 12-6 1 1-6Zm-2 2 5 5"/></svg><span>${portal.escape(portal.t('Edit'))}</span></a>` : ''}
                    </p>
                  </div><hgroup><h3>${portal.escape(item.title)}</h3><div>${item.description}</div></hgroup>
                </article>`).join('')}
              ${['search', 'map'].includes(page.name) ? '</div>' : ''}
              ${!['home', 'login', 'search', 'map'].includes(page.name)
                  && !(['group', 'organization'].includes(page.name) && !page.id)
                  && !(macro && !page.group) && !group
                ? `<h1>${portal.escape(portal.t('Page Not Found'))}</h1>`
                : ''}
          </main>
          <footer id="footer" data-theme="dark">
            <section class="container">
              <div class="grid">
                <div class="footer-about">
                  <h2>${portal.escape(portal.info.about_title)}</h2>
                  ${portal.info.about_description}
                </div>
                <address>
                  <h3>${portal.escape(portal.t('Contacts'))}</h3>
                  ${portal.info.about_name ?    /* html */ `<p><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5Z" fill="none" stroke="currentColor"></path></svg>${portal.escape(portal.info.about_name)}</p>` : ''}
                  ${portal.info.about_tel ?     /* html */ `<p><a href="${portal.escape(portal.safeURL(`tel:${portal.info.about_tel}`))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m5 3 4 5-3 3a16 16 0 0 0 7 7l3-3 5 4c-2 7-10 2-14-2S-2 5 5 3Z"/></svg>${portal.escape(portal.info.about_tel)}</a></p>` : ''}
                  ${portal.info.about_email ?   /* html */ `<p><a href="${portal.escape(portal.safeURL(`mailto:${portal.info.about_email}`))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/></svg>${portal.escape(portal.info.about_email)}</a></p>` : ''}
                  ${portal.info.about_address ? /* html */ `<p><a href="${portal.escape(portal.safeURL(`https://maps.google.com/?q=${encodeURIComponent(portal.info.about_address)}`))}" target="_blank" rel="noopener noreferrer"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 9c0 6-8 13-8 13S4 15 4 9a8 8 0 1 1 16 0Z"/><circle cx="12" cy="9" r="3"/></svg>${portal.escape(portal.info.about_address)}</a></p>` : ''}
                  <p class="social-icons">
                    ${portal.info.facebook_url ?    /* html */ `<a href="${portal.escape(portal.safeURL(portal.info.facebook_url))}" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M15 22v-8h3l.5-4H15V8c0-1.2.4-2 2-2h1.7V2.4C18 2.2 16.8 2 15.5 2 12.5 2 10.5 3.8 10.5 7v3H7v4h3.5v8Z"/></svg></a>` : ''}
                    ${portal.info.twitter_url ?     /* html */ `<a href="${portal.escape(portal.safeURL(portal.info.twitter_url))}" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 4 20 20M20 4 4 20"/><path d="M4 4h4l12 16h-4z"/></svg></a>` : ''}
                    ${portal.info.googleplus_url ?  /* html */ `<a href="${portal.escape(portal.safeURL(portal.info.googleplus_url))}" target="_blank" rel="noopener noreferrer" aria-label="Googleplus"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.6 6.8-4.2m-6.8 7 6.8 4.2"/></svg></a>` : ''}
                    ${portal.info.youtube_url ?     /* html */ `<a href="${portal.escape(portal.safeURL(portal.info.youtube_url))}" target="_blank" rel="noopener noreferrer" aria-label="Youtube"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/></svg></a>` : ''}
                    ${portal.info.instagram_url ?   /* html */ `<a href="${portal.escape(portal.safeURL(portal.info.instagram_url))}" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.6 6.8-4.2m-6.8 7 6.8 4.2"/></svg></a>` : ''}
                    ${portal.info.flickr_url ?      /* html */ `<a href="${portal.escape(portal.safeURL(portal.info.flickr_url))}" target="_blank" rel="noopener noreferrer" aria-label="Flickr"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.6 6.8-4.2m-6.8 7 6.8 4.2"/></svg></a>` : ''}
                    ${portal.info.tripadvisor_url ? /* html */ `<a href="${portal.escape(portal.safeURL(portal.info.tripadvisor_url))}" target="_blank" rel="noopener noreferrer" aria-label="Tripadvisor"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.6 6.8-4.2m-6.8 7 6.8 4.2"/></svg></a>` : ''}
                  </p>
                </address>
              </div>
            </section>
            <nav>
              <div class="container">
                <ul>
                  ${[
                      [window.PORTAL_COOKIE_POLICY_URL || portal.info.cookie_policy_url, 'Cookie'],
                      [window.PORTAL_PRIVACY_POLICY_URL || portal.info.privacy_policy_url, 'Privacy'],
                    ]
                    .filter(([url]) => url)
                    .map(([url, label]) => `<li><a href="${portal.escape(portal.safeURL(url))}" class="contrast">${label}</a></li>`)
                    .join('')}
                  ${window.PORTAL_CREDITS_URL || portal.info.credits_url ? '<li><a href="#credits" data-credits class="contrast">Credits</a></li>' : ''}
                </ul>
              </div>
            </nav>
          </footer>

          <dialog id="portal-dialog" aria-labelledby="dialog-title" data-theme="light"></dialog>
          <dialog id="language-dialog" aria-labelledby="language-dialog-title" data-theme="light">
            <article>
              <header><form method="dialog"><input type="submit" aria-label="Close" value="" class="close contrast"></form><h3 id="language-dialog-title">${portal.escape(portal.t('Choose a language'))}</h3></header>
              <fieldset>${portal.locales.map(({ locale, name, flag }) => `<label><input type="radio" name="language" value="${portal.escape(locale)}" data-route="${portal.escape(page.path.replace(`/${page.locale}/`, `/${locale}/`))}"${locale === page.locale ? ' checked' : ''}>${flag}<span>${portal.escape(name)}</span></label>`).join('')}</fieldset>
            </article>
          </dialog>

          <a class="bottom-right" href="#" data-scroll-top title="Back to top" aria-label="Back to top" hidden>
            <svg class="ui-icon" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" focusable="false"><path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/></svg>
          </a>
        `;
        clearInterval(portal.carousel);
        document.documentElement.classList.remove('modal-is-open');
        document.querySelectorAll('[data-portal-ui], #app').forEach(element => element.remove());
        for (const element of template.content.children) element.setAttribute('data-portal-ui', '');
        document.body.append(template.content);

        document.querySelector('#search')?.addEventListener('input', event => {
          portal.search = event.target.value;
          document.querySelector('#search-results').innerHTML = portal.projects.filter(item => `${item.title || ''} ${item.description || ''}`.toLowerCase().includes(portal.search.toLowerCase())).map(item => /* html */`
            <article class="grid item-P P-${portal.escape(item.id)}">
              <div>
                <figure>
                  <img loading="lazy" src="${portal.escape(portal.safeURL(item.thumbnail) || new URL('assets/logo_g3wsuite.png', portal.scriptURL).href)}" alt="${portal.escape(item.title)}">
                </figure>
                <p>
                  <a href="${portal.escape(portal.safeURL(item.map_url))}" target="_blank" rel="noopener noreferrer">
                    <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 9V3h6m6 0h6v6m0 6v6h-6M9 21H3v-6M3 3l6 6m6 6 6 6M21 3l-6 6M9 15l-6 6"/></svg>
                    <span>${portal.escape(portal.t('View'))}</span>
                  </a>
                  ${item.ogc_urls && Object.keys(item.ogc_urls).length ? /* html */`<a href="#services" data-services="${portal.escape(item.id)}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m2 8 10-6 10 6-10 6Zm0 5 10 6 10-6M2 18l10 6 10-6"/></svg><span>${portal.escape(portal.t('Services'))}</span></a>` : ''}
                  ${portal.user && item.edit_url ? /* html */`<a href="${portal.escape(portal.safeURL(item.edit_url))}" target="_blank" rel="noopener noreferrer"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m16 3 5 5-12 12-6 1 1-6Zm-2 2 5 5"/></svg><span>${portal.escape(portal.t('Edit'))}</span></a>` : ''}
                </p>
              </div><hgroup><h3>${portal.escape(item.title)}</h3><div>${item.description}</div></hgroup>
            </article>`).join('');
        });
        document.querySelector('#login-form')?.addEventListener('submit', async event => {
          event.preventDefault();
          const form = event.target;
          const button = form.querySelector('button');
          const errorLabel = form.querySelector('#login-error');
          button.disabled = true;
          errorLabel.hidden = true;
          try {
            const data = new FormData(form);
            await portal.login(portal.route.locale, data.get('username'), data.get('password'));
            portal.user = await portal.whoami(portal.route.locale);
            if (!portal.user) throw new Error('Authentication was not established');
            Object.assign(portal, await portal.fetch(`${portal.route.locale}/portal/api/catalog/`), { locale: portal.route.locale });
            const next = portal.route.query.get('next') || new URL(location.href).searchParams.get('next') || `/${portal.route.locale}/`;
            if (!next.startsWith('/') || new URL(next, location.origin).origin !== location.origin) throw new Error('Invalid return path');
            if (['Bearer', 'JWT'].includes(portal.auth) && portal.user.drf_token) {
              const url = new URL(`${portal.route.locale}/portal/api/whoami/`, portal.base);
              const redirect = new URL(portal.routePrefix + next, location.href);
              redirect.searchParams.delete('next');
              url.search = new URLSearchParams({ __drftk: portal.user.drf_token, redirect: redirect.href });
              location.assign(url.href);
              return;
            }
            const url = new URL(location.href);
            url.searchParams.delete('next');
            history.replaceState({}, '', url);
            portal.memoryPath = next;
            if (portal.mode !== 'abstract') history.pushState({}, '', portal.routePrefix + next);
            await portal.render();
          } catch (error) {
            console.error('Portal login:', error);
            errorLabel.textContent = `${portal.t('Login error')}: ${error.message}`;
            errorLabel.hidden = false;
          } finally {
            button.disabled = false;
          }
        });
        if (page.name !== 'home') window.scrollTo({ top: 0, behavior: 'instant' });
        if (page.name === 'home' && portal.pictures.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
          let index = 0;
          portal.carousel = setInterval(() => {
            const picture = portal.pictures[++index % portal.pictures.length];
            document.querySelector('#carousel img').src = portal.safeURL(picture.image);
            document.querySelector('#carousel figcaption').innerHTML = `
              ${picture.author && picture.author_url ? `<a href="${portal.escape(portal.safeURL(picture.author_url))}">Photo by ${portal.escape(picture.author)}</a>` : ''}
              ${picture.author && !picture.author_url ? `<span>Photo by ${portal.escape(picture.author)}</span>` : ''}`;
          }, 5000);
        }
      } catch (error) {
        if (version !== portal.navigation) return;
        console.error('Portal:', error);
        document.querySelector('#content progress')?.remove();
        if (!document.querySelector('#content')) {
          clearInterval(portal.carousel);
          document.documentElement.classList.remove('modal-is-open');
          document.querySelectorAll('[data-portal-ui], #app').forEach(element => element.remove());
          document.body.insertAdjacentHTML('beforeend', '<main id="content" class="container" data-portal-ui></main>');
        }
        const alert = document.querySelector('#portal-error') ?? document.querySelector('#content').appendChild(Object.assign(document.createElement('p'), { id: 'portal-error' }));
        alert.setAttribute('role', 'alert');
        alert.setAttribute('data-portal-ui', '');
        alert.replaceChildren(document.createTextNode(error.message + ' '));
        const retry = document.createElement('button');
        retry.textContent = 'Retry';
        retry.onclick = () => {
          portal.locale = '';
          portal.render();
        };
        alert.append(retry);
      }
    },
  };

  document.addEventListener('click', async event => {
    const target = event.target.closest('a, button, summary');
    if (!target || event.defaultPrevented || event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (target.hasAttribute('data-route')) {
      event.preventDefault();
      portal.memoryPath = target.dataset.route;
      if (portal.mode !== 'abstract') history.pushState({}, '', portal.routePrefix + target.dataset.route);
      portal.render();
      return;
    }
    if (target.hasAttribute('data-logout')) {
      event.preventDefault();
      try {
        await portal.logout();
      } catch (error) {
        console.error('Portal:', error);
        document.querySelector('#content progress')?.remove();
        if (!document.querySelector('#content')) {
          clearInterval(portal.carousel);
          document.documentElement.classList.remove('modal-is-open');
          document.querySelectorAll('[data-portal-ui], #app').forEach(element => element.remove());
          document.body.insertAdjacentHTML('beforeend', '<main id="content" class="container" data-portal-ui></main>');
        }
        const alert = document.querySelector('#portal-error') ?? document.querySelector('#content').appendChild(Object.assign(document.createElement('p'), { id: 'portal-error' }));
        alert.setAttribute('role', 'alert');
        alert.setAttribute('data-portal-ui', '');
        alert.replaceChildren(document.createTextNode(error.message + ' '));
        const retry = document.createElement('button');
        retry.textContent = 'Retry';
        retry.onclick = () => {
          portal.locale = '';
          portal.render();
        };
        alert.append(retry);
      }
      return;
    }
    if (target.hasAttribute('data-menu')) {
      const menu = document.querySelector('#secondary-menu');
      menu.hidden = !menu.hidden;
      target.setAttribute('aria-expanded', String(!menu.hidden));
      return;
    }
    if (target.hasAttribute('data-language-toggle')) {
      event.preventDefault();
      const locale = portal.route.locale === 'it' ? 'en' : 'it';
      if (!portal.languages.includes(locale)) return;
      portal.memoryPath = portal.route.path.replace(`/${portal.route.locale}/`, `/${locale}/`);
      if (portal.mode !== 'abstract') history.pushState({}, '', portal.routePrefix + portal.memoryPath);
      portal.render();
      return;
    }
    if (target.hasAttribute('data-languages')) {
      event.preventDefault();
      const dialog = document.querySelector('#language-dialog');
      dialog.addEventListener('close', () => document.documentElement.classList.remove('modal-is-open'), { once: true });
      document.documentElement.classList.add('modal-is-open');
      dialog.showModal();
      return;
    }
    if (target.hasAttribute('data-services') || target.hasAttribute('data-credits')) {
      event.preventDefault();
      const dialog = document.querySelector('#portal-dialog');
      const item = target.hasAttribute('data-services') && (['group', 'organization'].includes(portal.route.name) ? portal.visibleProjects : portal.projects).find(item => String(item.id) === target.dataset.services);
      const title = item ? item.title : 'Applicativo realizzato con il framework Open Source';
      const html = item
        ? `<h4>${portal.escape(portal.t('Network services - OGC'))}      <a href="${portal.escape(portal.safeURL(`https://docs.qgis.org/3.34/${portal.route.locale}/docs/server_manual/services.html`))}" target="_blank" rel="noopener noreferrer" aria-label="QGIS documentation">&#x2139;</a></h4><ul>${Object.entries(item.ogc_urls).map(([name, url]) => `<li><b>${portal.escape(name)}:</b> <a href="${portal.escape(portal.safeURL(url))}" target="_blank" rel="noopener noreferrer">${portal.escape(portal.safeURL(url))}</a></li>`).join('')}</ul>`
        : `<section class="credits-content"><p><a href="${portal.escape(portal.safeURL('https://g3wsuite.it/'))}" target="_blank" rel="noopener noreferrer"><img src="${new URL('assets/logo_g3wsuite.png', portal.scriptURL).href}" alt="G3W SUITE" width="250"></a></p>      <p>Pubblica e gestisci i tuoi progetti QGIS sul Web</p>      <address><a href="${portal.escape(portal.safeURL('https://maps.google.com/?q=Montecatini%20Terme%2C%20Italy'))}" target="_blank" rel="noopener noreferrer"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 9c0 6-8 13-8 13S4 15 4 9a8 8 0 1 1 16 0Z"/><circle cx="12" cy="9" r="3"/></svg>Montecatini Terme - Italy</a>        <a href="${portal.escape(portal.safeURL('tel:+393938534336'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m5 3 4 5-3 3a16 16 0 0 0 7 7l3-3 5 4c-2 7-10 2-14-2S-2 5 5 3Z"/></svg>+39 393 8534336</a><a href="${portal.escape(portal.safeURL('mailto:info@gis3w.it'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/></svg>info@gis3w.it</a></address>      ${portal.info.credits}</section><footer>Framework sviluppato da <a href="${portal.escape(portal.safeURL('https://www.gis3w.it'))}" target="_blank" rel="noopener noreferrer"><img src="${new URL('assets/logo_gis3w_156_85.png', portal.scriptURL).href}" alt="Gis3w" width="60"></a></footer>`;
      dialog.innerHTML = `<article><header><form method="dialog"><input type="submit" aria-label="Close" value="" class="close contrast"></form>    <h3 id="dialog-title">${portal.escape(title)}</h3></header>${html}</article>`;
      dialog.addEventListener('close', () => document.documentElement.classList.remove('modal-is-open'), {
        once: true
      });
      document.documentElement.classList.add('modal-is-open');
      dialog.showModal();
      return;
    }
    if (target.hasAttribute('data-scroll-top')) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      return;
    }
    if (target.hasAttribute('data-skip-content')) {
      event.preventDefault();
      document.querySelector('#content').focus();
    }
  });

  document.addEventListener('change', event => {
    const input = event.target.closest('#language-dialog input[name="language"]');
    if (!input) return;
    input.closest('dialog').close();
    portal.memoryPath = input.dataset.route;
    if (portal.mode !== 'abstract') history.pushState({}, '', portal.routePrefix + input.dataset.route);
    portal.render();
  });
  window.addEventListener('popstate', () => portal.render());
  window.addEventListener('hashchange', () => portal.render());
  window.addEventListener('scroll', () => {
    const button = document.querySelector('[data-scroll-top]');
    if (button) button.hidden = window.scrollY < 150;
  }, { passive: true });

  if (window.PORTAL_FAVICON) {
    const icon = document.querySelector('link[rel="icon"]') || document.head.appendChild(document.createElement('link'));
    icon.rel = 'icon';
    icon.href = portal.safeURL(window.PORTAL_FAVICON);
  }
  portal.render();
})();