import { config, adminURL, portal, login, logout, tokens } from './api.js';
import english from './locale/en.js';

const state = { locale: '', info: {}, pictures: [], macros: [], groups: [], projects: [], user: null, search: '' };
let messages = english;
let route;
let navigation = 0;
let carousel;
let memoryPath = '/';
const asset = path => new URL(`assets/${path}`, import.meta.url).href;
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const t = key => key.split('.').reduce((value, part) => value?.[part], messages)
  ?? key.split('.').reduce((value, part) => value?.[part], english) ?? key;
const fallback = [navigator.language.split('-')[0], 'en', config.languages[0]]
  .find(lang => config.languages.includes(lang));

function safeURL(value, base = config.base) {
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

function href(path) {
  return config.mode === 'hash' ? `#${path}` : path;
}

function link(path, label, attributes = '') {
  return `<a href="${escape(href(path))}" data-route="${escape(path)}" ${attributes}>${label}</a>`;
}

function external(url, label, attributes = '') {
  return `<a href="${escape(safeURL(url))}" ${attributes}>${label}</a>`;
}

function navigate(path, replace = false) {
  if (config.mode === 'abstract') memoryPath = path;
  else history[replace ? 'replaceState' : 'pushState']({}, '', href(path));
  return render();
}

function returnPath(path) {
  if (!path.startsWith('/') || new URL(path, location.origin).origin !== location.origin) throw new Error('Invalid return path');
  return path;
}

function parseRoute() {
  const path = config.mode === 'abstract' ? memoryPath
    : config.mode === 'hash' ? location.hash.slice(1) || '/' : location.pathname + location.search;
  const url = new URL(path, location.origin);
  const parts = url.pathname.split('/').filter(Boolean);
  const locale = config.languages.includes(parts[0]) ? parts.shift() : fallback;
  const [name = 'home', id, group, ...extra] = parts;
  const known = ['home', 'login', 'logout', 'admin', 'search', 'group', 'organization', 'map'];
  return {
    locale, name: known.includes(name) && !extra.length ? name : '404', id, group,
    path: `/${locale}/${parts.join('/')}`, query: url.searchParams,
  };
}

async function load(locale) {
  const [info, pictures, macros, groups, projects] = await Promise.all([
    portal(locale, '/api/infodata/'), portal(locale, '/api/pictures/'),
    portal(locale, '/api/macrogroup/'), portal(locale, '/api/group/nomacrogroup/'),
    portal(locale, '/api/project/'),
  ]);
  if (![pictures, macros, groups, projects].every(Array.isArray)) throw new Error('Invalid catalog response');
  return { info, pictures: pictures.sort((a, b) => a.order - b.order), macros, groups, projects, locale };
}

async function whoami(locale) {
  const user = await portal(locale, '/api/whoami/');
  if (config.auth === 'cookie' || !user.is_authenticated) tokens();
  return user.is_authenticated ? user : null;
}

function groupCard(item, macro = false) {
  const path = macro ? `organization/${item.id}`
    : route.name === 'organization' && route.id ? `organization/${route.id}/${item.id}` : `group/${item.id}`;
  const title = item.title || item.name || t('maps.group');
  return `<article class="${macro ? 'MG' : 'G'}-${escape(item.id)} item-${macro ? 'MG' : 'G'}">
    ${link(`/${route.locale}/${path}`, `<figure>
      <img loading="lazy" src="${escape(safeURL(item.logo_img || item.header_logo_img) || asset('logo_g3wsuite.png'))}" alt="${escape(title)}">
      <figcaption><h3>${escape(title)}</h3></figcaption></figure>`)}
  </article>`;
}

function projects(items) {
  return items.map(item => `<article class="grid item-P P-${escape(item.id)}">
    <div><figure><img loading="lazy" src="${escape(safeURL(item.thumbnail) || asset('logo_g3wsuite.png'))}" alt="${escape(item.title)}"></figure>
      <p>${external(item.map_url, escape(t('maps.view')), 'target="_blank" rel="noopener noreferrer"')}
      ${item.ogc_urls && Object.keys(item.ogc_urls).length ? `<a href="#services" data-services="${escape(item.id)}">${escape(t('maps.services'))}</a>` : ''}
      ${state.user && item.edit_url ? external(item.edit_url, escape(t('maps.edit')), 'target="_blank" rel="noopener noreferrer"') : ''}</p>
    </div><hgroup><h3>${escape(item.title)}</h3><div>${rich(item.description)}</div></hgroup>
  </article>`).join('');
}

function languageMenu() {
  const flagNames = { en: 'en_GB', it: 'it_IT', fr: 'fr_FR', de: 'de_DE', bg: 'bg_BG', fi: 'fi_FI', pt: 'pt_PT', ro: 'ro_RO', se: 'se_SE' };
  const label = locale => `<img class="flag" src="${asset(`flags/${flagNames[locale] || 'en_GB'}.png`)}" alt="" width="18" height="12"> ${escape(t(`language.${locale}`))}`;
  const languages = config.languages.map(locale => {
    const path = route.path.replace(`/${route.locale}/`, `/${locale}/`);
    return `<li>${link(path, label(locale), `hreflang="${escape(locale)}"`)}</li>`;
  }).join('');
  return `<li class="nav-lang"><details role="list"><summary role="link" aria-label="${escape(t('tooltip.choose_language'))}"
    ${window.PORTAL_LANG_BUTTON ? 'data-language-toggle' : ''}>${label(route.locale)}</summary>
    <ul role="listbox">${languages}</ul></details></li>`;
}

function authLinks() {
  const lang = route.locale;
  return state.user
    ? `<li class="nav-admin">${link(`/${lang}/admin`, escape(t('menu.admin')))}</li>
       <li class="nav-logout"><a href="${escape(href(`/${lang}/logout`))}" data-logout>${escape(t('menu.logout'))}</a></li>`
    : `<li class="nav-login">${link(`/${lang}/login`, escape(t('menu.login')))}</li>`;
}

function navbar() {
  const info = state.info;
  const top = window.PORTAL_NAVBAR_TOP !== false;
  const menu = top || window.PORTAL_MENU_BUTTON !== false;
  const orgName = window.PORTAL_ORG_NAME || info.suite_org_name || '';
  const orgImage = window.PORTAL_ORG_IMAGE || info.suite_org_image;
  const org = orgImage ? `<img class="logo" src="${escape(safeURL(orgImage))}" alt="${escape(orgName)}">` : escape(orgName);
  const orgURL = window.PORTAL_ORG_URL || info.suite_org_url;
  return `${top ? `<nav id="top-menu" class="container-fluid top-menu"><ul><li class="nav-org">
    ${orgURL ? external(orgURL, org, `title="${escape(window.PORTAL_ORG_TITLE || '')}"`) : org}
    </li></ul><ul>${authLinks()}${languageMenu()}</ul></nav>` : ''}
    <nav id="main-menu" class="container-fluid main-menu">
      <ul><li class="nav-logo">${info.url_suite_logo
        ? external(info.url_suite_logo, logo())
        : link(`/${route.locale}/`, logo(), 'aria-label="Back home"')}</li>
      <li class="nav-title hide-on-mobile"><span class="h1">${escape(info.title)}</span><span>${escape(info.sub_title)}</span></li></ul>
      <ul><li class="nav-search">${link(`/${route.locale}/search`, escape(t('menu.search')), `title="${escape(t('menu.search_placeholder'))}"`)}</li>
      ${!top ? authLinks() + languageMenu() : ''}
      ${menu ? `<li><button type="button" class="outline contrast" data-menu aria-controls="secondary-menu" aria-expanded="false">${escape(t('menu.toggle'))}</button></li>` : ''}</ul>
      <ul id="secondary-menu" ${menu ? 'hidden' : ''}>
        <li>${link(`/${route.locale}/`, escape(t('menu.home')))}</li>
        <li>${link(`/${route.locale}/group`, escape(t('menu.group')))}</li>
      </ul>
    </nav>`;
}

function logo() {
  const src = state.info.suite_logo;
  return `<img class="logo" src="${escape(src && !src.endsWith('/') ? safeURL(src) : asset('logo_g3wsuite-bw.png'))}" alt="${escape(state.info.title)}">`;
}

function footer() {
  const info = state.info;
  const contacts = [
    info.about_name ? `<p>${escape(info.about_name)}</p>` : '',
    info.about_tel ? `<p>${external(`tel:${info.about_tel}`, escape(info.about_tel))}</p>` : '',
    info.about_email ? `<p>${external(`mailto:${info.about_email}`, escape(info.about_email))}</p>` : '',
    info.about_address ? `<p>${external(`https://maps.google.com/?q=${encodeURIComponent(info.about_address)}`, escape(info.about_address), 'target="_blank" rel="noopener noreferrer"')}</p>` : '',
  ].join('');
  const socials = ['facebook', 'twitter', 'googleplus', 'youtube', 'instagram', 'flickr', 'tripadvisor']
    .filter(name => info[`${name}_url`]).map(name => external(info[`${name}_url`], escape(name))).join(' ');
  const policies = [
    [window.PORTAL_COOKIE_POLICY_URL || info.cookie_policy_url, 'Cookie'],
    [window.PORTAL_PRIVACY_POLICY_URL || info.privacy_policy_url, 'Privacy'],
  ].filter(([url]) => url).map(([url, label]) => `<li>${external(url, label)}</li>`).join('');
  return `<footer id="footer" data-theme="dark"><section class="container"><div class="grid">
    <div><h2>${escape(info.about_title)}</h2>${rich(info.about_description)}</div>
    <address><h3>${escape(t('footer.contacts'))}</h3>${contacts}<p class="social-icons">${socials}</p></address>
    </div></section><nav class="container"><ul>${policies}
    ${window.PORTAL_CREDITS_URL || info.credits_url ? '<li><a href="#credits" data-credits>Credits</a></li>' : ''}</ul></nav></footer>`;
}

function homeHeader() {
  const picture = state.pictures[0];
  return `<header id="header">${picture ? `<figure id="carousel"><img src="${escape(safeURL(picture.image))}" alt="">
    <figcaption>${photoCredit(picture)}</figcaption></figure>` : ''}
    ${state.info.home_description ? `<div class="container" data-theme="dark">${rich(state.info.home_description)}</div>` : ''}</header>`;
}

function photoCredit(picture) {
  return picture.author ? picture.author_url
    ? external(picture.author_url, `Photo by ${escape(picture.author)}`)
    : `<span>Photo by ${escape(picture.author)}</span>` : '';
}

function loginForm() {
  const info = state.info;
  return `<article class="grid login-form"><div><h2>${escape(info.login_title || t('login.title'))}</h2>
    <form id="login-form"><label for="username">${escape(t('login.username'))}</label>
      <input id="username" name="username" autocomplete="username" required>
      <label for="password">${escape(t('login.password'))}</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required>
      <button type="submit" class="contrast">${escape(t('login.submit'))}</button>
      ${Object.entries(info.social_auth_providers || {}).map(([name, url]) => external(url, escape(name), 'role="button" class="contrast outline social-login"')).join('')}
      <p id="login-error" role="alert" hidden></p>
      ${info.reset_password_url ? external(info.reset_password_url, escape(t('login.reset_password_url'))) : ''}
    </form></div>${info.login_description ? `<div>${rich(info.login_description)}</div>` : ''}</article>`;
}

async function content(current) {
  const info = state.info;
  const allGroups = () => state.macros.map(item => groupCard(item, true)).concat(state.groups.map(item => groupCard(item))).join('');
  const heading = item => `<hgroup><h2>${escape(item.title || item.name)}</h2><div>${rich(item.description)}</div></hgroup>`;
  if (current.name === 'home') {
    const limit = Number(window.PORTAL_MAX_HOME_ARTICLES ?? 6);
    const cards = [...state.macros.map(item => groupCard(item, true)), ...state.groups.map(item => groupCard(item))];
    const max = !Number.isFinite(limit) || limit < 0 ? cards.length : limit;
    return { title: 'Home', html: `<div class="show-on-mobile"><span>${escape(info.sub_title)}</span><h1>${escape(info.title)}</h1></div>
      <hgroup><h2>${escape(info.groups_title)}</h2><div>${rich(info.groups_map_description)}</div></hgroup>
      <div class="grid catalog">${cards.slice(0, max).join('')}</div>
      ${max > 0 && cards.length > max ? `<div id="load-more">${link(`/${current.locale}/group`, escape(t('home.show_all_button')), 'role="button"')}</div>` : ''}` };
  }
  if (current.name === 'login') return { title: t('menu.login'), html: loginForm() };
  if (current.name === 'search' || current.name === 'map') return {
    title: t('menu.search'), html: `<input type="search" id="search" aria-label="${escape(t('menu.search_placeholder'))}"
      placeholder="${escape(t('menu.search_placeholder'))}" value="${escape(state.search)}"><div id="search-results">${projects(filteredProjects())}</div>`,
  };
  if (['group', 'organization'].includes(current.name)) {
    if (!current.id) return { title: t(`menu.${current.name}`), html: `<div class="grid catalog">${current.name === 'organization' ? state.macros.map(item => groupCard(item, true)).join('') : allGroups()}</div>` };
    const macro = current.name === 'organization' && state.macros.find(item => String(item.id) === current.id);
    if (current.name === 'organization' && !macro) return missing(current);
    if (macro && !current.group) {
      const groups = await portal(current.locale, `/api/group/${current.id}`);
      return { title: macro.title, html: `${heading(macro)}<div class="grid catalog">${groups.map(item => groupCard(item)).join('')}</div>` };
    }
    const groups = macro ? await portal(current.locale, `/api/group/${current.id}`) : state.groups;
    const group = groups.find(item => String(item.id) === (current.group || current.id));
    if (!group) return missing(current);
    const items = await portal(current.locale, `/api/group/${group.id}/projects/`);
    state.visibleProjects = items;
    return { title: group.title || group.name, html: `${heading(group)}${projects(items)}` };
  }
  return { title: t('menu.404'), html: `<h1>${escape(t('menu.404'))}</h1>` };
}

function missing(current) {
  if (!state.user) return { redirect: `/${current.locale}/login?${new URLSearchParams({ next: current.path })}` };
  return { title: t('menu.404'), html: `<h1>${escape(t('menu.404'))}</h1>` };
}

function filteredProjects() {
  const search = state.search.toLowerCase();
  return state.projects.filter(item => `${item.title || ''} ${item.description || ''}`.toLowerCase().includes(search));
}

function mount(html) {
  clearInterval(carousel);
  document.querySelectorAll('[data-portal-ui], #app').forEach(element => element.remove());
  const template = document.createElement('template');
  template.innerHTML = html;
  for (const element of template.content.children) element.setAttribute('data-portal-ui', '');
  document.body.append(template.content);
}

function showError(error) {
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
  retry.onclick = () => { state.locale = ''; render(); };
  alert.append(retry);
}

async function render() {
  const version = ++navigation;
  const current = parseRoute();
  route = current;
  try {
    if (state.locale !== current.locale) {
      const locale = ['en', 'it', 'fr', 'de', 'bg', 'fi', 'pt', 'ro', 'se'].includes(current.locale) ? current.locale : 'en';
      const [translation, data, user] = await Promise.all([
        import(`./locale/${locale}.js`), load(current.locale), whoami(current.locale),
      ]);
      if (version !== navigation) return;
      messages = translation.default;
      Object.assign(state, data, { user });
    }
    const url = new URL(location.href);
    if (state.user && url.searchParams.get('next')) {
      const next = returnPath(url.searchParams.get('next'));
      url.searchParams.delete('next');
      history.replaceState({}, '', url);
      return navigate(next, true);
    }
    if (current.name === 'admin') {
      location.assign(adminURL(window.PORTAL_ADMIN_ROOT ?? '/admin'));
      return;
    }
    if (current.name === 'logout') {
      await doLogout();
      return;
    }
    if (current.name === 'login' && state.info.login_url && state.info.login_url !== 'login') {
      location.assign(safeURL(state.info.login_url));
      return;
    }
    const page = await content(current);
    if (version !== navigation) return;
    if (page.redirect) return navigate(page.redirect, true);
    document.documentElement.lang = current.locale;
    document.documentElement.dataset.theme = window.PORTAL_THEME || 'light';
    document.body.classList.remove('home', 'login', 'search', 'group', 'organization', 'map', '404');
    document.body.classList.add(current.name);
    document.title = `${page.title} - ${state.info.title || 'G3W-SUITE'}`;
    if (config.mode === 'hash' && !location.hash) history.replaceState({}, '', href(current.path));
    mount(`<button type="button" class="skip-link" data-skip-content>Skip to content</button>${navbar()}
      ${current.name === 'home' ? homeHeader() : ''}
      <nav id="breadcrumb" class="container" aria-label="breadcrumb"><ul>
        <li>${link(`/${current.locale}/`, 'Home')}</li>
        ${['group', 'organization'].includes(current.name) && current.id ? `<li>${link(`/${current.locale}/${current.name}`, escape(t(`menu.${current.name}`)))}</li>` : ''}
        ${current.name === 'organization' && current.group ? `<li>${link(`/${current.locale}/organization/${current.id}`, escape(state.macros.find(item => String(item.id) === current.id)?.title))}</li>` : ''}
        ${current.name !== 'home' ? `<li aria-current="page">${escape(page.title)}</li>` : ''}
      </ul></nav><main id="content" class="container" tabindex="-1">${page.html}</main>${footer()}
      <dialog id="portal-dialog" aria-labelledby="dialog-title" data-theme="light"></dialog>
      <button class="bottom-right" data-scroll-top aria-label="Back to top" hidden>&uarr;</button>`);
    document.querySelector('#search')?.addEventListener('input', event => {
      state.search = event.target.value;
      document.querySelector('#search-results').innerHTML = projects(filteredProjects());
    });
    document.querySelector('#login-form')?.addEventListener('submit', submitLogin);
    if (current.name === 'home' && state.pictures.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let index = 0;
      carousel = setInterval(() => {
        const picture = state.pictures[++index % state.pictures.length];
        document.querySelector('#carousel img').src = safeURL(picture.image);
        document.querySelector('#carousel figcaption').innerHTML = photoCredit(picture);
      }, 5000);
    }
  } catch (error) {
    if (version === navigation) showError(error);
  }
}

async function submitLogin(event) {
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
    const next = returnPath(route.query.get('next') || new URL(location.href).searchParams.get('next') || `/${route.locale}/`);
    if (['Bearer', 'JWT'].includes(config.auth) && state.user.drf_token) {
      const url = new URL(`${route.locale}/portal/api/whoami/`, config.base);
      const redirect = new URL(href(next), location.href);
      redirect.searchParams.delete('next');
      url.search = new URLSearchParams({ __drftk: state.user.drf_token, redirect: redirect.href });
      location.assign(url.href);
      return;
    }
    const url = new URL(location.href);
    url.searchParams.delete('next');
    history.replaceState({}, '', url);
    await navigate(next);
  } catch (error) {
    console.error('Portal login:', error);
    errorLabel.textContent = `${t('login.erroreLogin')}: ${error.message}`;
    errorLabel.hidden = false;
  } finally {
    button.disabled = false;
  }
}

async function doLogout() {
  if (state.info.logout_url && !['logout', 'login'].includes(state.info.logout_url)) {
    location.assign(safeURL(state.info.logout_url));
    return;
  }
  try {
    await logout(route.locale, state.user);
    Object.assign(state, { user: null, locale: '', projects: [], groups: [], macros: [], visibleProjects: [] });
    mount('<main id="content" class="container"><progress aria-label="Loading"></progress></main>');
    Object.assign(state, await load(route.locale));
    if (route.name === 'logout') await navigate(`/${route.locale}/`, true);
    else await render();
  } catch (error) {
    showError(error);
  }
}

function showDialog(title, html) {
  const dialog = document.querySelector('#portal-dialog');
  dialog.innerHTML = `<article><header><form method="dialog"><button class="close" aria-label="Close">Close</button></form>
    <h3 id="dialog-title">${escape(title)}</h3></header>${html}</article>`;
  dialog.showModal();
}

document.addEventListener('click', event => {
  const target = event.target.closest('a, button, summary');
  if (!target || event.defaultPrevented || event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  if (target.hasAttribute('data-route')) {
    event.preventDefault();
    navigate(target.dataset.route);
  } else if (target.hasAttribute('data-logout')) {
    event.preventDefault();
    doLogout();
  } else if (target.hasAttribute('data-menu')) {
    const menu = document.querySelector('#secondary-menu');
    menu.hidden = !menu.hidden;
    target.setAttribute('aria-expanded', String(!menu.hidden));
  } else if (target.hasAttribute('data-language-toggle')) {
    event.preventDefault();
    const locale = route.locale === 'it' ? 'en' : 'it';
    if (config.languages.includes(locale)) navigate(route.path.replace(`/${route.locale}/`, `/${locale}/`));
  } else if (target.hasAttribute('data-services')) {
    event.preventDefault();
    const item = [...state.projects, ...(state.visibleProjects || [])].find(item => String(item.id) === target.dataset.services);
    showDialog(item.title, `<h4>${escape(t('ogc_services'))}</h4><ul>${Object.entries(item.ogc_urls).map(([name, url]) =>
      `<li><b>${escape(name)}:</b> ${external(url, escape(adminURL(url)), 'target="_blank" rel="noopener noreferrer"')}</li>`).join('')}</ul>`);
  } else if (target.hasAttribute('data-credits')) {
    event.preventDefault();
    showDialog('Credits', `<p>${external('https://g3wsuite.it/', `<img src="${asset('logo_g3wsuite.png')}" alt="G3W SUITE" width="200">`)}</p>
      <p>Applicativo realizzato con il framework Open Source</p>
      <p>Pubblica e gestisci i tuoi progetti QGIS sul Web</p>
      <address>${external('https://maps.google.com/?q=Montecatini%20Terme%2C%20Italy', 'Montecatini Terme - Italy')}<br>
        ${external('tel:+393938534336', '+39 393 8534336')}<br>${external('mailto:info@gis3w.it', 'info@gis3w.it')}</address>
      <p>Framework sviluppato da ${external('https://www.gis3w.it', `<img src="${asset('logo_gis3w_156_85.png')}" alt="Gis3w" width="60">`)}</p>
      ${rich(state.info.credits)}`);
  } else if (target.hasAttribute('data-scroll-top')) {
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
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
}, { passive: true });

if (window.PORTAL_FAVICON) {
  const icon = document.querySelector('link[rel="icon"]') || document.head.appendChild(document.createElement('link'));
  icon.rel = 'icon';
  icon.href = safeURL(window.PORTAL_FAVICON);
}
render();
