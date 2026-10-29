const state = {
  base: new URL(window.API_BASE_URL || '/', location.href),
  languages: window.LANGUAGES || ['en', 'it'],
  auth: window.PORTAL_AUTH_MODE || 'cookie',
  get tokenAuth() { return ['JWT', 'Bearer'].includes(this.auth); },
  refreshRequest: undefined,
  mode: window.PORTAL_HISTORY_MODE || 'hash',
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
  messages: {},
};

const routePrefix = state.mode === 'hash' ? '#' : '';

async function request(path, { method = 'GET', body, retry = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = body instanceof URLSearchParams
    ? 'application/x-www-form-urlencoded' : 'application/json';
  const access = state.tokenAuth && localStorage.getItem('access_token');
  if (access) headers.Authorization = `${state.auth} ${access}`;
  if (method !== 'GET' && new URL(path, state.base).origin === location.origin) {
    const cookie = document.cookie.split('; ').find(item => item.startsWith('csrftoken='));
    if (cookie) headers['X-CSRFToken'] = decodeURIComponent(cookie.slice('csrftoken='.length));
  }
  let payload;
  if (body !== undefined) {
    payload = body instanceof URLSearchParams ? body.toString() : JSON.stringify(body);
  }
  const response = await fetch(new URL(path, state.base).href, {
    method,
    headers,
    credentials: state.tokenAuth ? 'same-origin' : 'include',
    body: payload,
  });
  if (state.tokenAuth && retry && [401, 403].includes(response.status) && !path.includes('/authjwt/') && localStorage.getItem('refresh_token')) {
    if (access === localStorage.getItem('access_token')) {
      state.refreshRequest ??= request('/authjwt/api/token/refresh/', {
        method: 'POST', body: { refresh: localStorage.getItem('refresh_token') }, retry: false,
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
      }).finally(() => { state.refreshRequest = undefined; });
      await state.refreshRequest;
    }
    return request(path, { method, body, retry: false });
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${path}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function login(locale, username, password) {
  if (state.tokenAuth) {
    const data = await request('/authjwt/api/token/', { method: 'POST', body: { username, password }, retry: false });
    if (typeof data.access !== 'string' || !data.access || typeof data.refresh !== 'string' || !data.refresh) throw new Error('Invalid authentication response');
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
  } else {
    const data = await request(`${locale}/portal/jx/login/`, {
      method: 'POST', body: new URLSearchParams({ username, password }),
    });
    if (data.status !== 'ok') throw new Error(Object.values(data.errors_form || data.error_form || {}).flat().join(' ') || 'Login failed');
  }
}

async function logout(locale, user) {
  if (state.tokenAuth) {
    await request('/authjwt/api/token/blacklist/', {
      method: 'POST', body: { refresh: localStorage.getItem('refresh_token') }, retry: false,
    });
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    if (user?.drf_token) {
      const url = new URL(`${locale}/portal/jx/logout/`, state.base);
      url.search = new URLSearchParams({ __drftk: user.drf_token, redirect: location.href });
      location.assign(url.href);
      return;
    }
  } else {
    const data = await request(`${locale}/portal/jx/logout/`);
    if (data.status !== 'ok') throw new Error(data.message || 'Logout failed');
  }
}

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[char]);

const t = key => state.messages[key] ?? key;

function safeURL(value, base = new URL(window.API_ASSET_BASE_URL || state.base, location.href)) {
  if (!value) return '';
  const url = new URL(value, base);
  return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : '';
}

function rich(value) {
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
        const url = safeURL(attribute.value);
        if (url) element.setAttribute(attribute.name, url);
        else element.removeAttribute(attribute.name);
      }
    }
    if (element.getAttribute('target') === '_blank') element.setAttribute('rel', 'noopener noreferrer');
  }
  return template.innerHTML;
}

let route;
let navigation = 0;
let carousel;
let memoryPath = '/';

async function load(locale) {
  const [info, pictures, macros, groups, allGroups, projects] = await Promise.all([
    request(`${locale}/portal/api/infodata/`),
    request(`${locale}/portal/api/pictures/`),
    request(`${locale}/portal/api/macrogroup/`),
    request(`${locale}/portal/api/group/nomacrogroup/`),
    request(`${locale}/portal/api/group/`),
    request(`${locale}/portal/api/project/`),
  ]);
  if (![pictures, macros, groups, allGroups, projects].every(Array.isArray)) throw new Error('Invalid catalog response');
  return {
    info,
    pictures: pictures.sort((a, b) => a.order - b.order),
    macros,
    groups,
    allGroups,
    projects,
    locale
  };
}
async function whoami(locale) {
  const user = await request(`${locale}/portal/api/whoami/`);
  if (state.auth === 'cookie' || !user.is_authenticated) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
  return user.is_authenticated ? user : null;
}

function mount(html) {
  clearInterval(carousel);
  document.documentElement.classList.remove('modal-is-open');
  document.querySelectorAll('[data-portal-ui], #app').forEach(element => element.remove());
  const template = document.createElement('template');
  template.innerHTML = html;
  for (const element of template.content.children) element.setAttribute('data-portal-ui', '');
  document.body.append(template.content);
}

async function render() {
  const version = ++navigation;
  let path = location.pathname + location.search;
  if (state.mode === 'abstract') path = memoryPath;
  else if (state.mode === 'hash') path = location.hash.slice(1) || '/';
  const url = new URL(path, location.origin);
  const parts = url.pathname.split('/').filter(Boolean);
  const locale = state.languages.includes(parts[0]) ? parts.shift() : [navigator.language.split('-')[0], 'en', state.languages[0]].find(lang => state.languages.includes(lang));
  const [name = 'home', id, group, ...extra] = parts;
  const known = ['home', 'login', 'logout', 'admin', 'search', 'group', 'organization', 'map'];
  const valid = known.includes(name) && !extra.length && (name === 'organization' || !group) && (['organization', 'group', 'map'].includes(name) || !id);
  const current = {
    locale,
    name: valid ? name : '404',
    id,
    group,
    path: `/${locale}/${parts.join('/')}${url.search}`,
    query: url.searchParams,
  };
  route = current;
  state.route = current;
  try {
    if (state.locale !== current.locale) {
      const locale = ['en', 'it', 'fr', 'de', 'bg', 'fi', 'pt', 'ro', 'se'].includes(current.locale) ? current.locale : 'en';
      const [translation, data, user] = await Promise.all([locale === 'en' ? {} : import(`./locale/${locale}.js`), load(current.locale), whoami(current.locale),]);
      if (version !== navigation) return;
      state.messages = translation.default || {};
      Object.assign(state, data, { user });
    }
    const url = new URL(location.href);
    if (state.user && url.searchParams.get('next')) {
      const next = url.searchParams.get('next');
      if (!next.startsWith('/') || new URL(next, location.origin).origin !== location.origin) throw new Error('Invalid return path');
      url.searchParams.delete('next');
      history.replaceState({}, '', url);
      if (state.mode === 'abstract') memoryPath = next;
      else history.replaceState({}, '', routePrefix + next);
      return render();
    }
    if (current.name === 'admin') {
      location.assign(new URL(window.PORTAL_ADMIN_ROOT ?? '/admin', state.base).href);
      return;
    }
    if (current.name === 'logout') {
      if (state.info.login_url && state.info.login_url !== 'login' && state.info.logout_url && !['logout', 'login'].includes(state.info.logout_url)) {
        location.assign(safeURL(state.info.logout_url));
        return;
      }
      await logout(route.locale, state.user);
      Object.assign(state, {
        user: null,
        locale: '',
        projects: [],
        groups: [],
        allGroups: [],
        macros: [],
        visibleProjects: []
      });
      mount('<main id="content" class="container"><progress aria-label="Loading"></progress></main>');
      Object.assign(state, await load(route.locale));
      const path = `/${route.locale}/`;
      if (state.mode === 'abstract') memoryPath = path;
      else history.replaceState({}, '', routePrefix + path);
      await render();
      return;
    }
    if (current.name === 'login' && state.info.login_url && state.info.login_url !== 'login') {
      location.assign(safeURL(state.info.login_url));
      return;
    }
    const info = state.info;
    const macro = current.name === 'organization' && current.id
      ? state.macros.find(item => String(item.id) === current.id) : null;
    let groups;
    let group;
    let items;
    if (['group', 'organization'].includes(current.name) && current.id) {
      if (current.name !== 'organization' || macro) {
        groups = macro ? await request(`${current.locale}/portal/api/group/${current.id}`) : state.allGroups;
        if (!macro || current.group) {
          group = groups.find(item => String(item.id) === (current.group || current.id));
          if (group) {
            items = await request(`${current.locale}/portal/api/group/${group.id}/projects/`);
            state.visibleProjects = items;
          }
        }
      }
      if (version !== navigation) return;
      if (!state.user && !(macro && !current.group) && !group) {
        const path = `/${current.locale}/login?${new URLSearchParams({ next: current.path })}`;
        if (state.mode === 'abstract') memoryPath = path;
        else history.replaceState({}, '', routePrefix + path);
        return render();
      }
    }
    if (version !== navigation) return;
    document.documentElement.lang = current.locale;
    document.documentElement.dataset.theme = window.PORTAL_THEME || 'light';
    document.body.classList.remove('home', 'login', 'search', 'group', 'organization', 'map', '404');
    document.body.classList.add(current.name);
    let title = t('Page Not Found');
    if (current.name === 'home') title = 'Home';
    else if (current.name === 'login') title = t('Login');
    else if (['search', 'map'].includes(current.name)) title = t('Search');
    else if (['group', 'organization'].includes(current.name) && !current.id) title = t(current.name === 'group' ? 'Groups' : 'Organizations');
    else if (macro && !current.group) title = macro.title;
    else if (group) title = group.title || group.name;
    document.title = `${title} - ${info.title || 'G3W-SUITE'}`;
    if (state.mode === 'hash' && !location.hash) history.replaceState({}, '', routePrefix + current.path);

    const logo = `<img class="logo" src="${escape(info.suite_logo && !info.suite_logo.endsWith('/') ? safeURL(info.suite_logo) : new URL('assets/logo_g3wsuite-bw.png', import.meta.url).href)}" alt="${escape(info.title)}">`;
    const org = state.orgImage ? `<img class="logo" src="${escape(safeURL(state.orgImage))}" alt="${escape(state.orgName)}">` : escape(state.orgName);
    const picture = state.pictures[0];
    let cards;
    if (current.name === 'home' || current.name === 'group' && !current.id) {
      cards = [...state.groups.map(item => [item, false]), ...state.macros.map(item => [item, true])];
    } else if (current.name === 'organization' && !current.id) {
      cards = state.macros.map(item => [item, true]);
    } else if (macro && !current.group) {
      cards = groups.map(item => [item, false]);
    }
    const limit = Number(window.PORTAL_MAX_HOME_ARTICLES ?? 6);
    let max = cards?.length;
    if (current.name === 'home' && Number.isFinite(limit) && limit >= 0) max = limit;
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
    const languages = state.languages.map(locale => {
      const known = ['en', 'it', 'fr', 'de', 'bg', 'fi', 'pt', 'ro', 'se'].includes(locale);
      return {
        locale,
        name: new Intl.DisplayNames(known ? ['en'] : [locale], { type: 'language' }).of(locale === 'se' ? 'sv' : locale),
        flag: flagNames[locale] ? `<img class="flag" src="${new URL(`assets/flags/${flagNames[locale]}.png`, import.meta.url).href}" alt="" width="18" height="12"> ` : '',
      };
    });
    const language = languages.find(item => item.locale === current.locale);
    const languageMenu = /* html */`<details role="list">
      <summary role="link" aria-label="${escape(t('Choose a language'))}" ${window.PORTAL_LANG_BUTTON ? 'data-language-toggle' : ''}>
        ${language.flag}<span${language.flag ? ' class="hide-on-mobile"' : ''}>${escape(language.name)}</span>
      </summary>
      <ul role="listbox">${languages.map(({ locale, name, flag }) => {
        const path = current.path.replace(`/${current.locale}/`, `/${locale}/`);
        return `<li><a href="${escape(routePrefix + path)}" data-route="${escape(path)}" hreflang="${escape(locale)}">${flag}<span>${escape(name)}</span></a></li>`;
      }).join('')}</ul>
    </details>`;
    const [authLinks, mobileAuthLinks] = ['', 'show-on-mobile'].map(className => {
      const labelClass = className ? '' : ' class="hide-on-mobile"';
      if (state.user) {
        return /* html */`<li class="nav-admin ${className}">
          <a href="${escape(routePrefix + `/${current.locale}/admin`)}" data-route="${escape(`/${current.locale}/admin`)}" aria-label="${escape(t('Admin'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/></svg><span${labelClass}>${escape(t('Admin'))}</span></a>
        </li>
        <li class="nav-logout ${className}">
          <a href="${escape(routePrefix + `/${current.locale}/logout`)}" data-logout aria-label="${escape(t('Logout'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M9 3H3v18h6M9 12h13m-5-5 5 5-5 5"/></svg><span${labelClass}>${escape(t('Logout'))}</span></a>
        </li>`;
      }
      return /* html */`<li class="nav-login ${className}">
        <a href="${escape(routePrefix + `/${current.locale}/login`)}" data-route="${escape(`/${current.locale}/login`)}" aria-label="${escape(t('Login'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5Z" fill="currentColor" stroke="none"/></svg><span${labelClass}>${escape(t('Login'))}</span></a>
      </li>`;
    });
    mount(/* html */`
      <button type="button" class="skip-link" data-skip-content>Skip to content</button>
      ${state.top ? '<nav id="top-menu" class="container-fluid top-menu"><ul><li class="nav-org">' : ''}
      ${state.top && state.orgURL ? `<a href="${escape(safeURL(state.orgURL))}" title="${escape(window.PORTAL_ORG_TITLE || '')}">${org}</a>` : ''}
      ${state.top && !state.orgURL ? org : ''}
      ${state.top ? `</li></ul><ul>${authLinks}<li class="nav-lang">${languageMenu}</li></ul></nav>` : ''}
      <nav id="main-menu" class="container-fluid main-menu${!state.top && !state.menu ? ' compact' : ''}${!state.top && state.menu ? ' mobile-menu' : ''}">
        <ul>
          <li class="nav-logo">
            ${info.url_suite_logo ? `<a href="${escape(safeURL(info.url_suite_logo))}" aria-label="Back home">${logo}</a>` : `<a href="${escape(routePrefix + `/${current.locale}/`)}" data-route="${escape(`/${current.locale}/`)}" aria-label="Back home">${logo}</a>`}
          </li>
          <li class="nav-title hide-on-mobile">
            <span class="h1">${escape(info.title)}</span><span>${escape(info.sub_title)}</span>
          </li>
        </ul>
        <ul>
          <li class="nav-search"><a href="${escape(routePrefix + `/${current.locale}/search`)}" data-route="${escape(`/${current.locale}/search`)}" title="${escape(t('Find a map in the catalog'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="7"/><path d="m15 15 7 7"/></svg>${escape(t('Search'))}</a></li>
          ${!state.top ? `${authLinks}<li class="nav-lang">${languageMenu}</li>` : ''}
          ${state.menu && !state.top ? '<li class="nav-toggle show-on-mobile">' : ''}
          ${state.menu && state.top ? '<li class="nav-toggle">' : ''}
          ${state.menu ? `<button type="button" class="outline contrast" data-menu aria-controls="secondary-menu" aria-expanded="false">${escape(t('MENU'))}</button></li>` : ''}
        </ul>
        <ul id="secondary-menu" hidden>
          <li><a href="${escape(routePrefix + `/${current.locale}/`)}" data-route="${escape(`/${current.locale}/`)}">${escape(t('Home'))}</a></li>
          <li><a href="${escape(routePrefix + `/${current.locale}/group`)}" data-route="${escape(`/${current.locale}/group`)}">${escape(t('Groups'))}</a></li>
          ${!state.top && state.menu ? /* html */`<li class="show-on-mobile"><a href="${escape(routePrefix + `/${current.locale}/search`)}" data-route="${escape(`/${current.locale}/search`)}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="7"/><path d="m15 15 7 7"/></svg>${escape(t('Search'))}</a></li>
            ${mobileAuthLinks}
            <li class="nav-lang show-on-mobile">${languageMenu}</li>` : ''}
        </ul>
      </nav>
      ${current.name === 'home' ? '<header id="header">' : ''}
      ${current.name === 'home' && picture ? /* html */`
        <figure id="carousel">
          <img src="${escape(safeURL(picture.image))}" alt="">
          <figcaption>` : ''}
      ${current.name === 'home' && picture?.author && picture.author_url ? `<a href="${escape(safeURL(picture.author_url))}">Photo by ${escape(picture.author)}</a>` : ''}
      ${current.name === 'home' && picture?.author && !picture.author_url ? `<span>Photo by ${escape(picture.author)}</span>` : ''}
      ${current.name === 'home' && picture ? '</figcaption></figure>' : ''}
      ${current.name === 'home' && info.home_description ? `<div class="container" data-theme="dark">${rich(info.home_description)}</div>` : ''}
      ${current.name === 'home' ? '</header>' : ''}
      <nav id="breadcrumb" class="container" aria-label="breadcrumb">
        <ul>
          <li><a href="${escape(routePrefix + `/${current.locale}/`)}" data-route="${escape(`/${current.locale}/`)}" ${current.name === 'home' ? `aria-current="page" aria-label="${escape(t('Home'))}"` : ''}>${current.name === 'home' ? '' : 'Home'}</a></li>
          ${['group', 'organization'].includes(current.name) && current.id ? `<li><a href="${escape(routePrefix + `/${current.locale}/${current.name}`)}" data-route="${escape(`/${current.locale}/${current.name}`)}">${escape(t(current.name === 'group' ? 'Groups' : 'Organizations'))}</a></li>` : ''}
          ${current.name === 'organization' && current.group ? `<li><a href="${escape(routePrefix + `/${current.locale}/organization/${current.id}`)}" data-route="${escape(`/${current.locale}/organization/${current.id}`)}">${escape(state.macros.find(item => String(item.id) === current.id)?.title)}</a></li>` : ''}
          ${current.name !== 'home' ? `<li aria-current="page">${escape(title)}</li>` : ''}
        </ul>
      </nav>
      <main id="content" class="container" tabindex="-1">
        ${current.name === 'home'
            ? /* html */`
              <div class="show-on-mobile">
                <span>${escape(info.sub_title)}</span>
                <h1>${escape(info.title)}</h1>
              </div>
              <hgroup>
                <h2>${escape(info.groups_title)}</h2>
                <div>${rich(info.groups_map_description)}</div>
              </hgroup>
              `
            : ''}
          ${current.name === 'login'
            ? /* html */`
              <article class="grid login-form">
                <div>
                  <h2>${escape(info.login_title || t('Login to the admin system'))}</h2>
                  <form id="login-form"><label for="username">${escape(t('Username'))}</label>
                    <input id="username" name="username" placeholder="${escape(t('Username'))}" autocomplete="username" required>
                    <label for="password">${escape(t('Password'))}</label>
                    <input id="password" name="password" type="password" placeholder="${escape(t('Password'))}" autocomplete="current-password" required>
                    <button type="submit" class="contrast">${escape(t('Login'))}</button>
                    ${Object.entries(info.social_auth_providers || {}).map(([name, url]) => `<a href="${escape(safeURL(url))}" role="button" class="contrast outline social-login">${escape(name)}</a>`).join('')}
                    <p id="login-error" role="alert" hidden></p>
              `
            : ''}
          ${current.name === 'login' && info.reset_password_url ? `<a href="${escape(safeURL(info.reset_password_url))}">${escape(t('Forgot your password?'))}</a>` : ''}
          ${current.name === 'login' ? '</form></div>' : ''}
          ${current.name === 'login' && info.login_description ? `<div>${rich(info.login_description)}</div>` : ''}
          ${current.name === 'login' ? '</article>' : ''}
          ${['search', 'map'].includes(current.name)
            ? /* html */`
              <input type="search" id="search" aria-label="${escape(t('Find a map in the catalog'))}" placeholder="${escape(t('Find a map in the catalog'))}" value="${escape(state.search)}">
              `
            : ''}
          ${macro && !current.group
            ? /* html */`
              <hgroup>
                <h2>${escape(macro.title || macro.name)}</h2>
                <div>${rich(macro.description)}</div>
              </hgroup>
              `
            : ''}
          ${group
            ? /* html */`
              <hgroup>
                <h2>${escape(group.title || group.name)}</h2>
                <div>${rich(group.description)}</div>
              </hgroup>
              `
            : ''}
          ${cards ? '<div class="grid catalog">' : ''}
          ${(cards || []).slice(0, max).map(([item, isMacro]) => {
            let path = `group/${item.id}`;
            if (isMacro) path = `organization/${item.id}`;
            else if (current.name === 'organization' && current.id) path = `organization/${current.id}/${item.id}`;
            const title = item.title || item.name || t('Group');
            return /* html */`
              <article class="${isMacro ? 'MG' : 'G'}-${escape(item.id)} item-${isMacro ? 'MG' : 'G'}">
                <a href="${escape(routePrefix + `/${current.locale}/${path}`)}" data-route="${escape(`/${current.locale}/${path}`)}"><figure>
                  <img loading="lazy" src="${escape(safeURL(item.logo_img || item.header_logo_img) || new URL('assets/logo_g3wsuite.png', import.meta.url).href)}" alt="${escape(title)}">
                  <figcaption><h3><b>${escape(title)}</b></h3></figcaption>
                </figure></a>
              </article>`;
          }).join('')}
          ${cards ? '</div>' : ''}
          ${current.name === 'home' && max > 0 && cards.length > max ? `<div id="load-more"><a href="${escape(routePrefix + `/${current.locale}/group`)}" data-route="${escape(`/${current.locale}/group`)}" role="button">${escape(t('Show all'))}</a></div>` : ''}
          ${['search', 'map'].includes(current.name) ? '<div id="search-results">' : ''}
          ${(items || state.projects).filter(item => {
            if (group) return true;
            if (!['search', 'map'].includes(current.name)) return false;
            return `${item.title || ''} ${item.description || ''}`.toLowerCase().includes(state.search.toLowerCase());
          }).map(item => /* html */`
            <article class="grid item-P P-${escape(item.id)}">
              <div><figure><img loading="lazy" src="${escape(safeURL(item.thumbnail) || new URL('assets/logo_g3wsuite.png', import.meta.url).href)}" alt="${escape(item.title)}"></figure>
                <p><a href="${escape(safeURL(item.map_url))}" target="_blank" rel="noopener noreferrer"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 9V3h6m6 0h6v6m0 6v6h-6M9 21H3v-6M3 3l6 6m6 6 6 6M21 3l-6 6M9 15l-6 6"/></svg><span>${escape(t('View'))}</span></a>
                  ${item.ogc_urls && Object.keys(item.ogc_urls).length ? `<a href="#services" data-services="${escape(item.id)}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m2 8 10-6 10 6-10 6Zm0 5 10 6 10-6M2 18l10 6 10-6"/></svg><span>${escape(t('Services'))}</span></a>` : ''}
                  ${state.user && item.edit_url ? `<a href="${escape(safeURL(item.edit_url))}" target="_blank" rel="noopener noreferrer"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m16 3 5 5-12 12-6 1 1-6Zm-2 2 5 5"/></svg><span>${escape(t('Edit'))}</span></a>` : ''}
                </p>
              </div><hgroup><h3>${escape(item.title)}</h3><div>${rich(item.description)}</div></hgroup>
            </article>`).join('')}
          ${['search', 'map'].includes(current.name) ? '</div>' : ''}
          ${!['home', 'login', 'search', 'map'].includes(current.name)
              && !(['group', 'organization'].includes(current.name) && !current.id)
              && !(macro && !current.group) && !group
            ? `<h1>${escape(t('Page Not Found'))}</h1>`
            : ''}
      </main>
      <footer id="footer" data-theme="dark">
        <section class="container">
          <div class="grid">
            <div class="footer-about">
              <h2>${escape(info.about_title)}</h2>
              ${rich(info.about_description)}
            </div>
            <address>
              <h3>${escape(t('Contacts'))}</h3>
              ${info.about_name ?    /* html */ `<p><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5Z" fill="currentColor" stroke="none"/></svg>${escape(info.about_name)}</p>` : ''}
              ${info.about_tel ?     /* html */ `<p><a href="${escape(safeURL(`tel:${info.about_tel}`))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m5 3 4 5-3 3a16 16 0 0 0 7 7l3-3 5 4c-2 7-10 2-14-2S-2 5 5 3Z"/></svg>${escape(info.about_tel)}</a></p>` : ''}
              ${info.about_email ?   /* html */ `<p><a href="${escape(safeURL(`mailto:${info.about_email}`))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/></svg>${escape(info.about_email)}</a></p>` : ''}
              ${info.about_address ? /* html */ `<p><a href="${escape(safeURL(`https://maps.google.com/?q=${encodeURIComponent(info.about_address)}`))}" target="_blank" rel="noopener noreferrer"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 9c0 6-8 13-8 13S4 15 4 9a8 8 0 1 1 16 0Z"/><circle cx="12" cy="9" r="3"/></svg>${escape(info.about_address)}</a></p>` : ''}
              <p class="social-icons">
                ${['facebook', 'twitter', 'googleplus', 'youtube', 'instagram', 'flickr', 'tripadvisor']
                  .filter(name => info[`${name}_url`])
                  .map(name => `<a href="${escape(safeURL(info[`${name}_url`]))}" target="_blank" rel="noopener noreferrer" aria-label="${escape(name[0].toUpperCase() + name.slice(1))}">
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
                .map(([url, label]) => `<li><a href="${escape(safeURL(url))}" class="contrast">${label}</a></li>`)
                .join('')}
              ${window.PORTAL_CREDITS_URL || info.credits_url ? '<li><a href="#credits" data-credits class="contrast">Credits</a></li>' : ''}
            </ul>
          </div>
        </nav>
      </footer>
      
      <dialog id="portal-dialog" aria-labelledby="dialog-title" data-theme="light"></dialog>
      
      <a class="bottom-right" href="#" data-scroll-top title="Back to top" aria-label="Back to top" hidden>
        <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 15 12 6l9 9Z" fill="currentColor" stroke="none"/></svg>
      </a>
    `);
    
    document.querySelector('#search')?.addEventListener('input', event => {
      state.search = event.target.value;
      document.querySelector('#search-results').innerHTML = state.projects.filter(item => `${item.title || ''} ${item.description || ''}`.toLowerCase().includes(state.search.toLowerCase())).map(item => /* html */`
        <article class="grid item-P P-${escape(item.id)}">
          <div><figure><img loading="lazy" src="${escape(safeURL(item.thumbnail) || new URL('assets/logo_g3wsuite.png', import.meta.url).href)}" alt="${escape(item.title)}"></figure>
            <p><a href="${escape(safeURL(item.map_url))}" target="_blank" rel="noopener noreferrer"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 9V3h6m6 0h6v6m0 6v6h-6M9 21H3v-6M3 3l6 6m6 6 6 6M21 3l-6 6M9 15l-6 6"/></svg><span>${escape(t('View'))}</span></a>
              ${item.ogc_urls && Object.keys(item.ogc_urls).length ? `<a href="#services" data-services="${escape(item.id)}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m2 8 10-6 10 6-10 6Zm0 5 10 6 10-6M2 18l10 6 10-6"/></svg><span>${escape(t('Services'))}</span></a>` : ''}
              ${state.user && item.edit_url ? `<a href="${escape(safeURL(item.edit_url))}" target="_blank" rel="noopener noreferrer"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m16 3 5 5-12 12-6 1 1-6Zm-2 2 5 5"/></svg><span>${escape(t('Edit'))}</span></a>` : ''}
            </p>
          </div><hgroup><h3>${escape(item.title)}</h3><div>${rich(item.description)}</div></hgroup>
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
        await login(route.locale, data.get('username'), data.get('password'));
        state.user = await whoami(route.locale);
        if (!state.user) throw new Error('Authentication was not established');
        Object.assign(state, await load(route.locale));
        const next = route.query.get('next') || new URL(location.href).searchParams.get('next') || `/${route.locale}/`;
        if (!next.startsWith('/') || new URL(next, location.origin).origin !== location.origin) throw new Error('Invalid return path');
        if (['Bearer', 'JWT'].includes(state.auth) && state.user.drf_token) {
          const url = new URL(`${route.locale}/portal/api/whoami/`, state.base);
          const redirect = new URL(routePrefix + next, location.href);
          redirect.searchParams.delete('next');
          url.search = new URLSearchParams({
            __drftk: state.user.drf_token,
            redirect: redirect.href
          });
          location.assign(url.href);
          return;
        }
        const url = new URL(location.href);
        url.searchParams.delete('next');
        history.replaceState({}, '', url);
        if (state.mode === 'abstract') memoryPath = next;
        else history.pushState({}, '', routePrefix + next);
        await render();
      } catch (error) {
        console.error('Portal login:', error);
        errorLabel.textContent = `${t('Login error')}: ${error.message}`;
        errorLabel.hidden = false;
      } finally {
        button.disabled = false;
      }
    });
    if (current.name !== 'home') window.scrollTo({
      top: 0,
      behavior: 'instant'
    });
    if (current.name === 'home' && state.pictures.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let index = 0;
      carousel = setInterval(() => {
        const picture = state.pictures[++index % state.pictures.length];
        document.querySelector('#carousel img').src = safeURL(picture.image);
        document.querySelector('#carousel figcaption').innerHTML = `
          ${picture.author && picture.author_url ? `<a href="${escape(safeURL(picture.author_url))}">Photo by ${escape(picture.author)}</a>` : ''}
          ${picture.author && !picture.author_url ? `<span>Photo by ${escape(picture.author)}</span>` : ''}`;
      }, 5000);
    }
  } catch (error) {
    if (version === navigation) {
      console.error('Portal:', error);
      document.querySelector('#content progress')?.remove();
      let alert = document.querySelector('#portal-error');
      if (!alert) {
        alert = document.createElement('p');
        alert.id = 'portal-error';
        alert.setAttribute('role', 'alert');
        alert.setAttribute('data-portal-ui', '');
        if (!document.querySelector('#content')) mount('<main id="content" class="container"></main>');
        document.querySelector('#content').append(alert);
      }
      alert.replaceChildren(document.createTextNode(error.message + ' '));
      const retry = document.createElement('button');
      retry.textContent = 'Retry';
      retry.onclick = () => {
        state.locale = '';
        render();
      };
      alert.append(retry);
    }
  }
}
document.addEventListener('click', async event => {
  const target = event.target.closest('a, button, summary');
  if (!target || event.defaultPrevented || event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  if (target.hasAttribute('data-route')) {
    event.preventDefault();
    if (state.mode === 'abstract') memoryPath = target.dataset.route;
    else history.pushState({}, '', routePrefix + target.dataset.route);
    render();
  } else if (target.hasAttribute('data-logout')) {
    event.preventDefault();
    if (state.info.login_url && state.info.login_url !== 'login' && state.info.logout_url && !['logout', 'login'].includes(state.info.logout_url)) {
      location.assign(safeURL(state.info.logout_url));
      return;
    }
    try {
      await logout(route.locale, state.user);
      Object.assign(state, {
        user: null,
        locale: '',
        projects: [],
        groups: [],
        allGroups: [],
        macros: [],
        visibleProjects: []
      });
      mount('<main id="content" class="container"><progress aria-label="Loading"></progress></main>');
      Object.assign(state, await load(route.locale));
      if (route.name === 'logout') {
        const path = `/${route.locale}/`;
        if (state.mode === 'abstract') memoryPath = path;
        else history.replaceState({}, '', routePrefix + path);
      }
      await render();
    } catch (error) {
      console.error('Portal:', error);
      document.querySelector('#content progress')?.remove();
      let alert = document.querySelector('#portal-error');
      if (!alert) {
        alert = document.createElement('p');
        alert.id = 'portal-error';
        alert.setAttribute('role', 'alert');
        alert.setAttribute('data-portal-ui', '');
        if (!document.querySelector('#content')) mount('<main id="content" class="container"></main>');
        document.querySelector('#content').append(alert);
      }
      alert.replaceChildren(document.createTextNode(error.message + ' '));
      const retry = document.createElement('button');
      retry.textContent = 'Retry';
      retry.onclick = () => {
        state.locale = '';
        render();
      };
      alert.append(retry);
    }
  } else if (target.hasAttribute('data-menu')) {
    const menu = document.querySelector('#secondary-menu');
    menu.hidden = !menu.hidden;
    target.setAttribute('aria-expanded', String(!menu.hidden));
  } else if (target.hasAttribute('data-language-toggle')) {
    event.preventDefault();
    const locale = route.locale === 'it' ? 'en' : 'it';
    if (state.languages.includes(locale)) {
      const path = route.path.replace(`/${route.locale}/`, `/${locale}/`);
      if (state.mode === 'abstract') memoryPath = path;
      else history.pushState({}, '', routePrefix + path);
      render();
    }
  } else if (target.hasAttribute('data-services') || target.hasAttribute('data-credits')) {
    event.preventDefault();
    const dialog = document.querySelector('#portal-dialog');
    let title;
    let html;
    if (target.hasAttribute('data-services')) {
      const items = ['group', 'organization'].includes(route.name) ? state.visibleProjects : state.projects;
      const item = items.find(item => String(item.id) === target.dataset.services);
      title = item.title;
      html = `<h4>${escape(t('Network services - OGC'))}      <a href="${escape(safeURL(`https://docs.qgis.org/3.34/${route.locale}/docs/server_manual/services.html`))}" target="_blank" rel="noopener noreferrer" aria-label="QGIS documentation">&#x2139;</a></h4><ul>${Object.entries(item.ogc_urls).map(([name, url]) => `<li><b>${escape(name)}:</b> <a href="${escape(safeURL(url))}" target="_blank" rel="noopener noreferrer">${escape(safeURL(url))}</a></li>`).join('')}</ul>`;
    } else {
      title = 'Applicativo realizzato con il framework Open Source';
      html = `<section class="credits-content"><p><a href="${escape(safeURL('https://g3wsuite.it/'))}" target="_blank" rel="noopener noreferrer"><img src="${new URL('assets/logo_g3wsuite.png', import.meta.url).href}" alt="G3W SUITE" width="250"></a></p>      <p>Pubblica e gestisci i tuoi progetti QGIS sul Web</p>      <address><a href="${escape(safeURL('https://maps.google.com/?q=Montecatini%20Terme%2C%20Italy'))}" target="_blank" rel="noopener noreferrer"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 9c0 6-8 13-8 13S4 15 4 9a8 8 0 1 1 16 0Z"/><circle cx="12" cy="9" r="3"/></svg>Montecatini Terme - Italy</a>        <a href="${escape(safeURL('tel:+393938534336'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m5 3 4 5-3 3a16 16 0 0 0 7 7l3-3 5 4c-2 7-10 2-14-2S-2 5 5 3Z"/></svg>+39 393 8534336</a><a href="${escape(safeURL('mailto:info@gis3w.it'))}"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/></svg>info@gis3w.it</a></address>      ${rich(state.info.credits)}</section><footer>Framework sviluppato da <a href="${escape(safeURL('https://www.gis3w.it'))}" target="_blank" rel="noopener noreferrer"><img src="${new URL('assets/logo_gis3w_156_85.png', import.meta.url).href}" alt="Gis3w" width="60"></a></footer>`;
    }
    dialog.innerHTML = `<article><header><form method="dialog"><input type="submit" aria-label="Close" value="" class="close contrast"></form>    <h3 id="dialog-title">${escape(title)}</h3></header>${html}</article>`;
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
window.addEventListener('popstate', render);
window.addEventListener('hashchange', render);
window.addEventListener('scroll', () => {
  const button = document.querySelector('[data-scroll-top]');
  if (button) button.hidden = window.scrollY < 150;
}, {
  passive: true
});
if (window.PORTAL_FAVICON) {
  const icon = document.querySelector('link[rel="icon"]') || document.head.appendChild(document.createElement('link'));
  icon.rel = 'icon';
  icon.href = safeURL(window.PORTAL_FAVICON);
}
render();