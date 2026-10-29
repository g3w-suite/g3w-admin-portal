const portal = {
  scriptURL: document.currentScript.src,
  base: new URL(window.API_BASE_URL || '/', location.href),
  languages: window.LANGUAGES || ['en', 'it'],
  auth: window.PORTAL_AUTH_MODE || 'cookie',
  get tokenAuth() { return ['JWT', 'Bearer'].includes(this.auth); },
  refreshRequest: undefined,
  mode: window.PORTAL_HISTORY_MODE || 'hash',
  get routePrefix() { return this.mode === 'hash' ? '#' : ''; },
  get top() { return window.PORTAL_NAVBAR_TOP !== false; },
  get menu() { return this.top || window.PORTAL_MENU_BUTTON !== false; },
  get orgName() { return window.PORTAL_ORG_NAME || this.info.suite_org_name || ''; },
  get orgImage() { return window.PORTAL_ORG_IMAGE || this.info.suite_org_image; },
  get orgURL() { return window.PORTAL_ORG_URL || this.info.suite_org_url; },
  locale: '',
  info: {},
  pictures: [],
  macros: [],
  groups: [],
  allGroups: [],
  projects: [],
  user: null,
  search: '',
  route: null,
  navigation: 0,
  carousel: undefined,
  memoryPath: '/',
  messages: {},
  async fetch(path, { method = 'GET', body, retry = true } = {}) {
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
    let payload;
    if (body !== undefined) {
      payload = body instanceof URLSearchParams ? body.toString() : JSON.stringify(body);
    }
    const response = await fetch(new URL(path, portal.base).href, {
      method,
      headers,
      credentials: portal.tokenAuth ? 'same-origin' : 'include',
      body: payload,
    });
    if (portal.tokenAuth && retry && [401, 403].includes(response.status) && !path.includes('/authjwt/') && localStorage.getItem('refresh_token')) {
      if (access === localStorage.getItem('access_token')) {
        portal.refreshRequest ??= portal.fetch('/authjwt/api/token/refresh/', {
          method: 'POST',
          retry: false,
          body: {
            refresh: localStorage.getItem('refresh_token')
          },
        }).then(data => {
          if (typeof data.access !== 'string' || !data.access) throw new Error('Invalid token refresh response');
          localStorage.setItem('access_token', data.access);
          const refresh = data.refresh || localStorage.getItem('refresh_token');
          if (refresh) localStorage.setItem('refresh_token', refresh);
          else localStorage.removeItem('refresh_token');
        }).catch(error => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          throw error;
        }).finally(() => { portal.refreshRequest = undefined; });
        await portal.refreshRequest;
      }
      return portal.fetch(path, { method, body, retry: false });
    }
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
    } else {
      const data = await portal.fetch(`${locale}/portal/jx/login/`, {
        method: 'POST', body: new URLSearchParams({ username, password }),
      });
      if (data.status !== 'ok') throw new Error(Object.values(data.errors_form || data.error_form || {}).flat().join(' ') || 'Login failed');
    }
  },
  async logout(locale, user) {
    if (portal.tokenAuth) {
      await portal.fetch('/authjwt/api/token/blacklist/', {
        method: 'POST', body: { refresh: localStorage.getItem('refresh_token') }, retry: false,
      });
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      if (user?.drf_token) {
        const url = new URL(`${locale}/portal/jx/logout/`, portal.base);
        url.search = new URLSearchParams({ __drftk: user.drf_token, redirect: location.href });
        location.assign(url.href);
        return;
      }
    } else {
      const data = await portal.fetch(`${locale}/portal/jx/logout/`);
      if (data.status !== 'ok') throw new Error(data.message || 'Logout failed');
    }
  },

  escape: value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]),

  t: key => portal.messages[key] ?? key,

  safeURL(value, base = portal.base) {
    if (!value) return '';
    const url = new URL(value, base);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : '';
  },

  rich(value) {
    const template = document.createElement('template');
    template.innerHTML = value || '';
    for (const element of template.content.querySelectorAll('*')) {
      if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON', 'SVG', 'MATH', 'META', 'LINK', 'BASE'].includes(element.tagName)) {
        element.remove();
        continue;
      }
      for (const attribute of [...element.attributes]) {
        if (/^on/i.test(attribute.name) || ['srcdoc', 'srcset'].includes(attribute.name)) element.removeAttribute(attribute.name);
        if (['href', 'src', 'action', 'xlink:href'].includes(attribute.name)) {
          const url = portal.safeURL(attribute.value);
          if (url) element.setAttribute(attribute.name, url);
          else element.removeAttribute(attribute.name);
        }
      }
      if (element.getAttribute('target') === '_blank') element.setAttribute('rel', 'noopener noreferrer');
    }
    return template.innerHTML;
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
    let path = location.pathname + location.search;
    if (portal.mode === 'abstract') path = portal.memoryPath;
    else if (portal.mode === 'hash') path = location.hash.slice(1) || '/';
    const url = new URL(path, location.origin);
    const parts = url.pathname.split('/').filter(Boolean);
    const locale = portal.languages.includes(parts[0]) ? parts.shift() : [navigator.language.split('-')[0], 'en', portal.languages[0]].find(lang => portal.languages.includes(lang));
    const [name = 'home', id, group, ...extra] = parts;
    const known = ['home', 'login', 'logout', 'admin', 'search', 'group', 'organization', 'map'];
    const valid = known.includes(name) && !extra.length && (name === 'organization' || !group) && (['organization', 'group', 'map'].includes(name) || !id);
    const page = {
      locale,
      name: valid ? name : '404',
      id,
      group,
      path: `/${locale}/${parts.join('/')}${url.search}`,
      query: url.searchParams,
    };
    portal.route = page;
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
      if (portal.user && url.searchParams.get('next')) {
        const next = url.searchParams.get('next');
        if (!next.startsWith('/') || new URL(next, location.origin).origin !== location.origin) throw new Error('Invalid return path');
        url.searchParams.delete('next');
        history.replaceState({}, '', url);
        if (portal.mode === 'abstract') portal.memoryPath = next;
        else history.replaceState({}, '', portal.routePrefix + next);
        return portal.render();
      }
      if (page.name === 'admin') {
        location.assign(new URL(window.PORTAL_ADMIN_ROOT ?? '/admin', portal.base).href);
        return;
      }
      if (page.name === 'logout') {
        if (portal.info.login_url && portal.info.login_url !== 'login' && portal.info.logout_url && !['logout', 'login'].includes(portal.info.logout_url)) {
          location.assign(portal.safeURL(portal.info.logout_url));
          return;
        }
        await portal.logout(portal.route.locale, portal.user);
        Object.assign(portal, {
          user: null,
          locale: '',
          projects: [],
          groups: [],
          allGroups: [],
          macros: [],
          visibleProjects: []
        });
        clearInterval(portal.carousel);
        document.documentElement.classList.remove('modal-is-open');
        document.querySelectorAll('[data-portal-ui], #app').forEach(element => element.remove());
        const template = document.createElement('template');
        template.innerHTML = '<main id="content" class="container"><progress aria-label="Loading"></progress></main>';
        for (const element of template.content.children) element.setAttribute('data-portal-ui', '');
        document.body.append(template.content);
        Object.assign(portal, await portal.fetch(`${portal.route.locale}/portal/api/catalog/`), { locale: portal.route.locale });
        const path = `/${portal.route.locale}/`;
        if (portal.mode === 'abstract') portal.memoryPath = path;
        else history.replaceState({}, '', portal.routePrefix + path);
        await portal.render();
        return;
      }
      if (page.name === 'login' && portal.info.login_url && portal.info.login_url !== 'login') {
        location.assign(portal.safeURL(portal.info.login_url));
        return;
      }
      const info = portal.info;
      const macro = page.name === 'organization' && page.id
        ? portal.macros.find(item => String(item.id) === page.id) : null;
      let groups;
      let group;
      let items;
      if (['group', 'organization'].includes(page.name) && page.id) {
        if (page.name !== 'organization' || macro) {
          groups = macro ? await portal.fetch(`${page.locale}/portal/api/group/${page.id}`) : portal.allGroups;
          if (!macro || page.group) {
            group = groups.find(item => String(item.id) === (page.group || page.id));
            if (group) {
              items = await portal.fetch(`${page.locale}/portal/api/group/${group.id}/projects/`);
              portal.visibleProjects = items;
            }
          }
        }
        if (version !== portal.navigation) return;
        if (!portal.user && !(macro && !page.group) && !group) {
          const path = `/${page.locale}/login?${new URLSearchParams({ next: page.path })}`;
          if (portal.mode === 'abstract') portal.memoryPath = path;
          else history.replaceState({}, '', portal.routePrefix + path);
          return portal.render();
        }
      }
      if (version !== portal.navigation) return;
      document.documentElement.lang = page.locale;
      document.documentElement.dataset.theme = window.PORTAL_THEME || 'light';
      document.body.classList.remove('home', 'login', 'search', 'group', 'organization', 'map', '404');
      document.body.classList.add(page.name);
      let title = portal.t('Page Not Found');
      if (page.name === 'home') title = 'Home';
      else if (page.name === 'login') title = portal.t('Login');
      else if (['search', 'map'].includes(page.name)) title = portal.t('Search');
      else if (['group', 'organization'].includes(page.name) && !page.id) title = portal.t(page.name === 'group' ? 'Groups' : 'Organizations');
      else if (macro && !page.group) title = macro.title;
      else if (group) title = group.title || group.name;
      document.title = `${title} - ${info.title || 'G3W-SUITE'}`;
      if (portal.mode === 'hash' && !location.hash) history.replaceState({}, '', portal.routePrefix + page.path);

      const logo = `<img class="logo" src="${portal.escape(info.suite_logo && !info.suite_logo.endsWith('/') ? portal.safeURL(info.suite_logo) : new URL('assets/logo_g3wsuite-bw.png', portal.scriptURL).href)}" alt="${portal.escape(info.title)}">`;
      const org = portal.orgImage ? `<img class="logo" src="${portal.escape(portal.safeURL(portal.orgImage))}" alt="${portal.escape(portal.orgName)}">` : portal.escape(portal.orgName);
      const picture = portal.pictures[0];
      let cards;
      if (page.name === 'home' || page.name === 'group' && !page.id) {
        cards = [...portal.groups.map(item => [item, false]), ...portal.macros.map(item => [item, true])];
      } else if (page.name === 'organization' && !page.id) {
        cards = portal.macros.map(item => [item, true]);
      } else if (macro && !page.group) {
        cards = groups.map(item => [item, false]);
      }
      const limit = Number(window.PORTAL_MAX_HOME_ARTICLES ?? 6);
      let max = cards?.length;
      if (page.name === 'home' && Number.isFinite(limit) && limit >= 0) max = limit;
      const flagNames = {
        en: 'en_GB',
        it: 'it_IT',
        fr: 'fr_FR',
        de: 'de_DE',
        bg: 'bg_BG',
        fi: 'fi_FI',
        pt: 'pt_PT',
        ro: 'ro_RO',
        se: 'se_SE'
      };
      const languages = portal.languages.map(locale => {
        const known = ['en', 'it', 'fr', 'de', 'bg', 'fi', 'pt', 'ro', 'se'].includes(locale);
        return {
          locale,
          name: new Intl.DisplayNames(known ? ['en'] : [locale], { type: 'language' }).of(locale === 'se' ? 'sv' : locale),
          flag: flagNames[locale] ? `<img class="flag" src="${new URL(`assets/flags/${flagNames[locale]}.png`, portal.scriptURL).href}" alt="" width="18" height="12"> ` : '',
        };
      });
      const language = languages.find(item => item.locale === page.locale);
      const languageMenu = /* html */`<a href="#language" ${window.PORTAL_LANG_BUTTON ? 'data-language-toggle' : 'data-languages aria-haspopup="dialog"'} aria-label="${portal.escape(portal.t('Choose a language'))}">
          ${language.flag}<span${language.flag ? ' class="hide-on-mobile"' : ''}>${portal.escape(language.name)}</span>
        </a>`;
      const languageDialog = /* html */`<dialog id="language-dialog" aria-labelledby="language-dialog-title" data-theme="light">
        <article>
          <header><form method="dialog"><input type="submit" aria-label="Close" value="" class="close contrast"></form><h3 id="language-dialog-title">${portal.escape(portal.t('Choose a language'))}</h3></header>
          <fieldset>${languages.map(({ locale, name, flag }) => `<label><input type="radio" name="language" value="${portal.escape(locale)}" data-route="${portal.escape(page.path.replace(`/${page.locale}/`, `/${locale}/`))}"${locale === page.locale ? ' checked' : ''}>${flag}<span>${portal.escape(name)}</span></label>`).join('')}</fieldset>
        </article>
      </dialog>`;
      const [authLinks, mobileAuthLinks] = ['', 'show-on-mobile'].map(className => {
        const labelClass = className ? '' : ' class="hide-on-mobile"';
        if (portal.user) {
          return /* html */`<li class="nav-admin ${className}">
            <a href="${portal.escape(portal.routePrefix + `/${page.locale}/admin`)}" data-route="${portal.escape(`/${page.locale}/admin`)}" aria-label="${portal.escape(portal.t('Admin'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/></svg><span${labelClass}>${portal.escape(portal.t('Admin'))}</span></a>
          </li>
          <li class="nav-logout ${className}">
            <a href="${portal.escape(portal.routePrefix + `/${page.locale}/logout`)}" data-logout aria-label="${portal.escape(portal.t('Logout'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M9 3H3v18h6M9 12h13m-5-5 5 5-5 5"/></svg><span${labelClass}>${portal.escape(portal.t('Logout'))}</span></a>
          </li>`;
        }
        return /* html */`<li class="nav-login ${className}">
          <a href="${portal.escape(portal.routePrefix + `/${page.locale}/login`)}" data-route="${portal.escape(`/${page.locale}/login`)}" aria-label="${portal.escape(portal.t('Login'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5Z" fill="currentColor" stroke="none"/></svg><span${labelClass}>${portal.escape(portal.t('Login'))}</span></a>
        </li>`;
      });
      const template = document.createElement('template');
      template.innerHTML = /* html */`
        <button type="button" class="skip-link" data-skip-content>Skip to content</button>
        ${portal.top ? '<nav id="top-menu" class="container-fluid top-menu"><ul><li class="nav-org">' : ''}
        ${portal.top && portal.orgURL ? `<a href="${portal.escape(portal.safeURL(portal.orgURL))}" title="${portal.escape(window.PORTAL_ORG_TITLE || '')}">${org}</a>` : ''}
        ${portal.top && !portal.orgURL ? org : ''}
        ${portal.top ? `</li></ul><ul>${authLinks}<li class="nav-lang">${languageMenu}</li></ul></nav>` : ''}
        <nav id="main-menu" class="container-fluid main-menu${!portal.top && !portal.menu ? ' compact' : ''}${!portal.top && portal.menu ? ' mobile-menu' : ''}">
          <ul>
            <li class="nav-logo">
              ${info.url_suite_logo ? `<a href="${portal.escape(portal.safeURL(info.url_suite_logo))}" aria-label="Back home">${logo}</a>` : `<a href="${portal.escape(portal.routePrefix + `/${page.locale}/`)}" data-route="${portal.escape(`/${page.locale}/`)}" aria-label="Back home">${logo}</a>`}
            </li>
            <li class="nav-title hide-on-mobile">
              <span class="h1">${portal.escape(info.title)}</span><span>${portal.escape(info.sub_title)}</span>
            </li>
          </ul>
          <ul>
            <li class="nav-search"><a href="${portal.escape(portal.routePrefix + `/${page.locale}/search`)}" data-route="${portal.escape(`/${page.locale}/search`)}" title="${portal.escape(portal.t('Find a map in the catalog'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="7"/><path d="m15 15 7 7"/></svg>${portal.escape(portal.t('Search'))}</a></li>
            ${!portal.top ? `${authLinks}<li class="nav-lang">${languageMenu}</li>` : ''}
            ${portal.menu && !portal.top ? '<li class="nav-toggle show-on-mobile">' : ''}
            ${portal.menu && portal.top ? '<li class="nav-toggle">' : ''}
            ${portal.menu ? `<button type="button" class="outline contrast" data-menu aria-controls="secondary-menu" aria-expanded="false">${portal.escape(portal.t('MENU'))}</button></li>` : ''}
          </ul>
          <ul id="secondary-menu" hidden>
            <li><a href="${portal.escape(portal.routePrefix + `/${page.locale}/`)}" data-route="${portal.escape(`/${page.locale}/`)}">${portal.escape(portal.t('Home'))}</a></li>
            <li><a href="${portal.escape(portal.routePrefix + `/${page.locale}/group`)}" data-route="${portal.escape(`/${page.locale}/group`)}">${portal.escape(portal.t('Groups'))}</a></li>
            ${!portal.top && portal.menu ? /* html */`<li class="show-on-mobile"><a href="${portal.escape(portal.routePrefix + `/${page.locale}/search`)}" data-route="${portal.escape(`/${page.locale}/search`)}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="7"/><path d="m15 15 7 7"/></svg>${portal.escape(portal.t('Search'))}</a></li>
              ${mobileAuthLinks}
              <li class="nav-lang show-on-mobile">${languageMenu}</li>` : ''}
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
        ${page.name === 'home' && info.home_description ? `<div class="container" data-theme="dark">${portal.rich(info.home_description)}</div>` : ''}
        ${page.name === 'home' ? '</header>' : ''}
        <nav id="breadcrumb" class="container" aria-label="breadcrumb">
          <ul>
            <li><a href="${portal.escape(portal.routePrefix + `/${page.locale}/`)}" data-route="${portal.escape(`/${page.locale}/`)}" ${page.name === 'home' ? `aria-current="page" aria-label="${portal.escape(portal.t('Home'))}"` : ''}>${page.name === 'home' ? '' : 'Home'}</a></li>
            ${['group', 'organization'].includes(page.name) && page.id ? `<li><a href="${portal.escape(portal.routePrefix + `/${page.locale}/${page.name}`)}" data-route="${portal.escape(`/${page.locale}/${page.name}`)}">${portal.escape(portal.t(page.name === 'group' ? 'Groups' : 'Organizations'))}</a></li>` : ''}
            ${page.name === 'organization' && page.group ? `<li><a href="${portal.escape(portal.routePrefix + `/${page.locale}/organization/${page.id}`)}" data-route="${portal.escape(`/${page.locale}/organization/${page.id}`)}">${portal.escape(portal.macros.find(item => String(item.id) === page.id)?.title)}</a></li>` : ''}
            ${page.name !== 'home' ? `<li aria-current="page">${portal.escape(title)}</li>` : ''}
          </ul>
        </nav>
        <main id="content" class="container" tabindex="-1">
          ${page.name === 'home'
              ? /* html */`
                <div class="show-on-mobile">
                  <span>${portal.escape(info.sub_title)}</span>
                  <h1>${portal.escape(info.title)}</h1>
                </div>
                <hgroup>
                  <h2>${portal.escape(info.groups_title)}</h2>
                  <div>${portal.rich(info.groups_map_description)}</div>
                </hgroup>
                `
              : ''}
            ${page.name === 'login'
              ? /* html */`
                <article class="grid login-form">
                  <div>
                    <h2>${portal.escape(info.login_title || portal.t('Login to the admin system'))}</h2>
                    <form id="login-form"><label for="username">${portal.escape(portal.t('Username'))}</label>
                      <input id="username" name="username" placeholder="${portal.escape(portal.t('Username'))}" autocomplete="username" required>
                      <label for="password">${portal.escape(portal.t('Password'))}</label>
                      <input id="password" name="password" type="password" placeholder="${portal.escape(portal.t('Password'))}" autocomplete="current-password" required>
                      <button type="submit" class="contrast">${portal.escape(portal.t('Login'))}</button>
                      ${Object.entries(info.social_auth_providers || {}).map(([name, url]) => `<a href="${portal.escape(portal.safeURL(url))}" role="button" class="contrast outline social-login">${portal.escape(name)}</a>`).join('')}
                      <p id="login-error" role="alert" hidden></p>
                `
              : ''}
            ${page.name === 'login' && info.reset_password_url ? `<a href="${portal.escape(portal.safeURL(info.reset_password_url))}">${portal.escape(portal.t('Forgot your password?'))}</a>` : ''}
            ${page.name === 'login' ? '</form></div>' : ''}
            ${page.name === 'login' && info.login_description ? `<div>${portal.rich(info.login_description)}</div>` : ''}
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
                  <div>${portal.rich(macro.description)}</div>
                </hgroup>
                `
              : ''}
            ${group
              ? /* html */`
                <hgroup>
                  <h2>${portal.escape(group.title || group.name)}</h2>
                  <div>${portal.rich(group.description)}</div>
                </hgroup>
                `
              : ''}
            ${cards ? '<div class="grid catalog">' : ''}
            ${(cards || []).slice(0, max).map(([item, isMacro]) => {
              let path = `group/${item.id}`;
              if (isMacro) path = `organization/${item.id}`;
              else if (page.name === 'organization' && page.id) path = `organization/${page.id}/${item.id}`;
              const title = item.title || item.name || portal.t('Group');
              return /* html */`
                <article class="${isMacro ? 'MG' : 'G'}-${portal.escape(item.id)} item-${isMacro ? 'MG' : 'G'}">
                  <a href="${portal.escape(portal.routePrefix + `/${page.locale}/${path}`)}" data-route="${portal.escape(`/${page.locale}/${path}`)}"><figure>
                    <img loading="lazy" src="${portal.escape(portal.safeURL(item.logo_img || item.header_logo_img) || new URL('assets/logo_g3wsuite.png', portal.scriptURL).href)}" alt="${portal.escape(title)}">
                    <figcaption><h3><b>${portal.escape(title)}</b></h3></figcaption>
                  </figure></a>
                </article>`;
            }).join('')}
            ${cards ? '</div>' : ''}
            ${page.name === 'home' && max > 0 && cards.length > max ? `<div id="load-more"><a href="${portal.escape(portal.routePrefix + `/${page.locale}/group`)}" data-route="${portal.escape(`/${page.locale}/group`)}" role="button">${portal.escape(portal.t('Show all'))}</a></div>` : ''}
            ${['search', 'map'].includes(page.name) ? '<div id="search-results">' : ''}
            ${(items || portal.projects).filter(item => {
              if (group) return true;
              if (!['search', 'map'].includes(page.name)) return false;
              return `${item.title || ''} ${item.description || ''}`.toLowerCase().includes(portal.search.toLowerCase());
            }).map(item => /* html */`
              <article class="grid item-P P-${portal.escape(item.id)}">
                <div><figure><img loading="lazy" src="${portal.escape(portal.safeURL(item.thumbnail) || new URL('assets/logo_g3wsuite.png', portal.scriptURL).href)}" alt="${portal.escape(item.title)}"></figure>
                  <p><a href="${portal.escape(portal.safeURL(item.map_url))}" target="_blank" rel="noopener noreferrer"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 9V3h6m6 0h6v6m0 6v6h-6M9 21H3v-6M3 3l6 6m6 6 6 6M21 3l-6 6M9 15l-6 6"/></svg><span>${portal.escape(portal.t('View'))}</span></a>
                    ${item.ogc_urls && Object.keys(item.ogc_urls).length ? `<a href="#services" data-services="${portal.escape(item.id)}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m2 8 10-6 10 6-10 6Zm0 5 10 6 10-6M2 18l10 6 10-6"/></svg><span>${portal.escape(portal.t('Services'))}</span></a>` : ''}
                    ${portal.user && item.edit_url ? `<a href="${portal.escape(portal.safeURL(item.edit_url))}" target="_blank" rel="noopener noreferrer"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m16 3 5 5-12 12-6 1 1-6Zm-2 2 5 5"/></svg><span>${portal.escape(portal.t('Edit'))}</span></a>` : ''}
                  </p>
                </div><hgroup><h3>${portal.escape(item.title)}</h3><div>${portal.rich(item.description)}</div></hgroup>
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
                <h2>${portal.escape(info.about_title)}</h2>
                ${portal.rich(info.about_description)}
              </div>
              <address>
                <h3>${portal.escape(portal.t('Contacts'))}</h3>
                ${info.about_name ?    /* html */ `<p><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5Z" fill="currentColor" stroke="none"/></svg>${portal.escape(info.about_name)}</p>` : ''}
                ${info.about_tel ?     /* html */ `<p><a href="${portal.escape(portal.safeURL(`tel:${info.about_tel}`))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m5 3 4 5-3 3a16 16 0 0 0 7 7l3-3 5 4c-2 7-10 2-14-2S-2 5 5 3Z"/></svg>${portal.escape(info.about_tel)}</a></p>` : ''}
                ${info.about_email ?   /* html */ `<p><a href="${portal.escape(portal.safeURL(`mailto:${info.about_email}`))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/></svg>${portal.escape(info.about_email)}</a></p>` : ''}
                ${info.about_address ? /* html */ `<p><a href="${portal.escape(portal.safeURL(`https://maps.google.com/?q=${encodeURIComponent(info.about_address)}`))}" target="_blank" rel="noopener noreferrer"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 9c0 6-8 13-8 13S4 15 4 9a8 8 0 1 1 16 0Z"/><circle cx="12" cy="9" r="3"/></svg>${portal.escape(info.about_address)}</a></p>` : ''}
                <p class="social-icons">
                  ${['facebook', 'twitter', 'googleplus', 'youtube', 'instagram', 'flickr', 'tripadvisor']
                    .filter(name => info[`${name}_url`])
                    .map(name => `<a href="${portal.escape(portal.safeURL(info[`${name}_url`]))}" target="_blank" rel="noopener noreferrer" aria-label="${portal.escape(name[0].toUpperCase() + name.slice(1))}">
                      <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                        ${name === 'facebook' ? '<path d="M15 22v-8h3l.5-4H15V8c0-1.2.4-2 2-2h1.7V2.4C18 2.2 16.8 2 15.5 2 12.5 2 10.5 3.8 10.5 7v3H7v4h3.5v8Z"/>' : ''}
                        ${name === 'twitter' ? '<path d="M4 4 20 20M20 4 4 20"/><path d="M4 4h4l12 16h-4z"/>' : ''}
                        ${name === 'youtube' ? '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>' : ''}
                        ${!['facebook', 'twitter', 'youtube'].includes(name) ? '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.6 6.8-4.2m-6.8 7 6.8 4.2"/>' : ''}
                      </svg></a>`
                    ).join(' ')}
                </p>
              </address>
            </div>
          </section>
          <nav>
            <div class="container">
              <ul>
                ${[
                    [window.PORTAL_COOKIE_POLICY_URL || info.cookie_policy_url, 'Cookie'],
                    [window.PORTAL_PRIVACY_POLICY_URL || info.privacy_policy_url, 'Privacy'],
                  ]
                  .filter(([url]) => url)
                  .map(([url, label]) => `<li><a href="${portal.escape(portal.safeURL(url))}" class="contrast">${label}</a></li>`)
                  .join('')}
                ${window.PORTAL_CREDITS_URL || info.credits_url ? '<li><a href="#credits" data-credits class="contrast">Credits</a></li>' : ''}
              </ul>
            </div>
          </nav>
        </footer>

        <dialog id="portal-dialog" aria-labelledby="dialog-title" data-theme="light"></dialog>
        ${languageDialog}

        <a class="bottom-right" href="#" data-scroll-top title="Back to top" aria-label="Back to top" hidden>
          <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 15 12 6l9 9Z" fill="currentColor" stroke="none"/></svg>
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
            <div><figure><img loading="lazy" src="${portal.escape(portal.safeURL(item.thumbnail) || new URL('assets/logo_g3wsuite.png', portal.scriptURL).href)}" alt="${portal.escape(item.title)}"></figure>
              <p><a href="${portal.escape(portal.safeURL(item.map_url))}" target="_blank" rel="noopener noreferrer"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 9V3h6m6 0h6v6m0 6v6h-6M9 21H3v-6M3 3l6 6m6 6 6 6M21 3l-6 6M9 15l-6 6"/></svg><span>${portal.escape(portal.t('View'))}</span></a>
                ${item.ogc_urls && Object.keys(item.ogc_urls).length ? `<a href="#services" data-services="${portal.escape(item.id)}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m2 8 10-6 10 6-10 6Zm0 5 10 6 10-6M2 18l10 6 10-6"/></svg><span>${portal.escape(portal.t('Services'))}</span></a>` : ''}
                ${portal.user && item.edit_url ? `<a href="${portal.escape(portal.safeURL(item.edit_url))}" target="_blank" rel="noopener noreferrer"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m16 3 5 5-12 12-6 1 1-6Zm-2 2 5 5"/></svg><span>${portal.escape(portal.t('Edit'))}</span></a>` : ''}
              </p>
            </div><hgroup><h3>${portal.escape(item.title)}</h3><div>${portal.rich(item.description)}</div></hgroup>
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
            url.search = new URLSearchParams({
              __drftk: portal.user.drf_token,
              redirect: redirect.href
            });
            location.assign(url.href);
            return;
          }
          const url = new URL(location.href);
          url.searchParams.delete('next');
          history.replaceState({}, '', url);
          if (portal.mode === 'abstract') portal.memoryPath = next;
          else history.pushState({}, '', portal.routePrefix + next);
          await portal.render();
        } catch (error) {
          console.error('Portal login:', error);
          errorLabel.textContent = `${portal.t('Login error')}: ${error.message}`;
          errorLabel.hidden = false;
        } finally {
          button.disabled = false;
        }
      });
      if (page.name !== 'home') window.scrollTo({
        top: 0,
        behavior: 'instant'
      });
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
      if (version === portal.navigation) {
        console.error('Portal:', error);
        document.querySelector('#content progress')?.remove();
        let alert = document.querySelector('#portal-error');
        if (!alert) {
          alert = document.createElement('p');
          alert.id = 'portal-error';
          alert.setAttribute('role', 'alert');
          alert.setAttribute('data-portal-ui', '');
          if (!document.querySelector('#content')) {
            clearInterval(portal.carousel);
            document.documentElement.classList.remove('modal-is-open');
            document.querySelectorAll('[data-portal-ui], #app').forEach(element => element.remove());
            const template = document.createElement('template');
            template.innerHTML = '<main id="content" class="container"></main>';
            for (const element of template.content.children) element.setAttribute('data-portal-ui', '');
            document.body.append(template.content);
          }
          document.querySelector('#content').append(alert);
        }
        alert.replaceChildren(document.createTextNode(error.message + ' '));
        const retry = document.createElement('button');
        retry.textContent = 'Retry';
        retry.onclick = () => {
          portal.locale = '';
          portal.render();
        };
        alert.append(retry);
      }
    }
  },
};

document.addEventListener('click', async event => {
  const target = event.target.closest('a, button, summary');
  if (!target || event.defaultPrevented || event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  if (target.hasAttribute('data-route')) {
    event.preventDefault();
    if (portal.mode === 'abstract') portal.memoryPath = target.dataset.route;
    else history.pushState({}, '', portal.routePrefix + target.dataset.route);
    portal.render();
  } else if (target.hasAttribute('data-logout')) {
    event.preventDefault();
    if (portal.info.login_url && portal.info.login_url !== 'login' && portal.info.logout_url && !['logout', 'login'].includes(portal.info.logout_url)) {
      location.assign(portal.safeURL(portal.info.logout_url));
      return;
    }
    try {
      await portal.logout(portal.route.locale, portal.user);
      Object.assign(portal, {
        user: null,
        locale: '',
        projects: [],
        groups: [],
        allGroups: [],
        macros: [],
        visibleProjects: []
      });
      clearInterval(portal.carousel);
      document.documentElement.classList.remove('modal-is-open');
      document.querySelectorAll('[data-portal-ui], #app').forEach(element => element.remove());
      const template = document.createElement('template');
      template.innerHTML = '<main id="content" class="container"><progress aria-label="Loading"></progress></main>';
      for (const element of template.content.children) element.setAttribute('data-portal-ui', '');
      document.body.append(template.content);
      Object.assign(portal, await portal.fetch(`${portal.route.locale}/portal/api/catalog/`), { locale: portal.route.locale });
      if (portal.route.name === 'logout') {
        const path = `/${portal.route.locale}/`;
        if (portal.mode === 'abstract') portal.memoryPath = path;
        else history.replaceState({}, '', portal.routePrefix + path);
      }
      await portal.render();
    } catch (error) {
      console.error('Portal:', error);
      document.querySelector('#content progress')?.remove();
      let alert = document.querySelector('#portal-error');
      if (!alert) {
        alert = document.createElement('p');
        alert.id = 'portal-error';
        alert.setAttribute('role', 'alert');
        alert.setAttribute('data-portal-ui', '');
        if (!document.querySelector('#content')) {
          clearInterval(portal.carousel);
          document.documentElement.classList.remove('modal-is-open');
          document.querySelectorAll('[data-portal-ui], #app').forEach(element => element.remove());
          const template = document.createElement('template');
          template.innerHTML = '<main id="content" class="container"></main>';
          for (const element of template.content.children) element.setAttribute('data-portal-ui', '');
          document.body.append(template.content);
        }
        document.querySelector('#content').append(alert);
      }
      alert.replaceChildren(document.createTextNode(error.message + ' '));
      const retry = document.createElement('button');
      retry.textContent = 'Retry';
      retry.onclick = () => {
        portal.locale = '';
        portal.render();
      };
      alert.append(retry);
    }
  } else if (target.hasAttribute('data-menu')) {
    const menu = document.querySelector('#secondary-menu');
    menu.hidden = !menu.hidden;
    target.setAttribute('aria-expanded', String(!menu.hidden));
  } else if (target.hasAttribute('data-language-toggle')) {
    event.preventDefault();
    const locale = portal.route.locale === 'it' ? 'en' : 'it';
    if (portal.languages.includes(locale)) {
      const path = portal.route.path.replace(`/${portal.route.locale}/`, `/${locale}/`);
      if (portal.mode === 'abstract') portal.memoryPath = path;
      else history.pushState({}, '', portal.routePrefix + path);
      portal.render();
    }
  } else if (target.hasAttribute('data-languages')) {
    event.preventDefault();
    const dialog = document.querySelector('#language-dialog');
    dialog.addEventListener('close', () => document.documentElement.classList.remove('modal-is-open'), { once: true });
    document.documentElement.classList.add('modal-is-open');
    dialog.showModal();
  } else if (target.hasAttribute('data-services') || target.hasAttribute('data-credits')) {
    event.preventDefault();
    const dialog = document.querySelector('#portal-dialog');
    let title;
    let html;
    if (target.hasAttribute('data-services')) {
      const items = ['group', 'organization'].includes(portal.route.name) ? portal.visibleProjects : portal.projects;
      const item = items.find(item => String(item.id) === target.dataset.services);
      title = item.title;
      html = `<h4>${portal.escape(portal.t('Network services - OGC'))}      <a href="${portal.escape(portal.safeURL(`https://docs.qgis.org/3.34/${portal.route.locale}/docs/server_manual/services.html`))}" target="_blank" rel="noopener noreferrer" aria-label="QGIS documentation">&#x2139;</a></h4><ul>${Object.entries(item.ogc_urls).map(([name, url]) => `<li><b>${portal.escape(name)}:</b> <a href="${portal.escape(portal.safeURL(url))}" target="_blank" rel="noopener noreferrer">${portal.escape(portal.safeURL(url))}</a></li>`).join('')}</ul>`;
    } else {
      title = 'Applicativo realizzato con il framework Open Source';
      html = `<section class="credits-content"><p><a href="${portal.escape(portal.safeURL('https://g3wsuite.it/'))}" target="_blank" rel="noopener noreferrer"><img src="${new URL('assets/logo_g3wsuite.png', portal.scriptURL).href}" alt="G3W SUITE" width="250"></a></p>      <p>Pubblica e gestisci i tuoi progetti QGIS sul Web</p>      <address><a href="${portal.escape(portal.safeURL('https://maps.google.com/?q=Montecatini%20Terme%2C%20Italy'))}" target="_blank" rel="noopener noreferrer"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 9c0 6-8 13-8 13S4 15 4 9a8 8 0 1 1 16 0Z"/><circle cx="12" cy="9" r="3"/></svg>Montecatini Terme - Italy</a>        <a href="${portal.escape(portal.safeURL('tel:+393938534336'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m5 3 4 5-3 3a16 16 0 0 0 7 7l3-3 5 4c-2 7-10 2-14-2S-2 5 5 3Z"/></svg>+39 393 8534336</a><a href="${portal.escape(portal.safeURL('mailto:info@gis3w.it'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/></svg>info@gis3w.it</a></address>      ${portal.rich(portal.info.credits)}</section><footer>Framework sviluppato da <a href="${portal.escape(portal.safeURL('https://www.gis3w.it'))}" target="_blank" rel="noopener noreferrer"><img src="${new URL('assets/logo_gis3w_156_85.png', portal.scriptURL).href}" alt="Gis3w" width="60"></a></footer>`;
    }
    dialog.innerHTML = `<article><header><form method="dialog"><input type="submit" aria-label="Close" value="" class="close contrast"></form>    <h3 id="dialog-title">${portal.escape(title)}</h3></header>${html}</article>`;
    dialog.addEventListener('close', () => document.documentElement.classList.remove('modal-is-open'), {
      once: true
    });
    document.documentElement.classList.add('modal-is-open');
    dialog.showModal();
  } else if (target.hasAttribute('data-scroll-top')) {
    event.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    });
  } else if (target.hasAttribute('data-skip-content')) {
    event.preventDefault();
    document.querySelector('#content').focus();
  }
});

document.addEventListener('change', event => {
  const input = event.target.closest('#language-dialog input[name="language"]');
  if (!input) return;
  input.closest('dialog').close();
  if (portal.mode === 'abstract') portal.memoryPath = input.dataset.route;
  else history.pushState({}, '', portal.routePrefix + input.dataset.route);
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