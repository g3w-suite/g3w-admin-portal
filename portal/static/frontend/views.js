import { config, portal } from './api.js';
import english from './locale/en.js';
import { state } from './state.js';

export const asset = path => new URL(`assets/${path}`, import.meta.url).href;

const assetBase = new URL(window.API_ASSET_BASE_URL || config.base, location.href);

export const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[char]);

export const t = key => key.split('.').reduce((value, part) => value?.[part], state.messages) ?? key.split('.').reduce((value, part) => value?.[part], english) ?? key;

export const fallback = [navigator.language.split('-')[0], 'en', config.languages[0]].find(lang => config.languages.includes(lang));

export function safeURL(value, base = assetBase) {
  if (!value) return '';
  const url = new URL(value, base);
  return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : '';
}

export function rich(value) {
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

export function href(path) {
  return config.mode === 'hash' ? `#${path}` : path;
}

export function link(path, label, attributes = '') {
  return `<a href="${escape(href(path))}" data-route="${escape(path)}" ${attributes}>${label}</a>`;
}

export function external(url, label, attributes = '') {
  return `<a href="${escape(safeURL(url))}" ${attributes}>${label}</a>`;
}

export function groupCard(item, macro = false) {
  const path = macro ? `organization/${item.id}` : state.route.name === 'organization' && state.route.id ? `organization/${state.route.id}/${item.id}` : `group/${item.id}`;
  const title = item.title || item.name || t('maps.group');
  return `<article class="${macro ? 'MG' : 'G'}-${escape(item.id)} item-${macro ? 'MG' : 'G'}">    ${link(`/${state.route.locale}/${path}`, `<figure>      <img loading="lazy" src="${escape(safeURL(item.logo_img || item.header_logo_img) || asset('logo_g3wsuite.png'))}" alt="${escape(title)}">      <figcaption><h3><b>${escape(title)}</b></h3></figcaption></figure>`)}  </article>`;
}

export function projects(items) {
  return items.map(item => `<article class="grid item-P P-${escape(item.id)}">    <div><figure><img loading="lazy" src="${escape(safeURL(item.thumbnail) || asset('logo_g3wsuite.png'))}" alt="${escape(item.title)}"></figure>      <p>${external(item.map_url, icon('expand') + `<span>${escape(t('maps.view'))}</span>`, 'target="_blank" rel="noopener noreferrer"')}      ${item.ogc_urls && Object.keys(item.ogc_urls).length ? `<a href="#services" data-services="${escape(item.id)}">${icon('layers')}<span>${escape(t('maps.services'))}</span></a>` : ''}      ${state.user && item.edit_url ? external(item.edit_url, icon('edit') + `<span>${escape(t('maps.edit'))}</span>`, 'target="_blank" rel="noopener noreferrer"') : ''}</p>    </div><hgroup><h3>${escape(item.title)}</h3><div>${rich(item.description)}</div></hgroup>  </article>`).join('');
}

function languageMenu(className = '') {
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
  const label = (locale, compact = false) => {
    const translated = t(`language.${locale}`);
    const name = translated === `language.${locale}` ? new Intl.DisplayNames([locale], {
      type: 'language'
    }).of(locale) : translated;
    return `${flagNames[locale] ? `<img class="flag" src="${asset(`flags/${flagNames[locale]}.png`)}" alt="" width="18" height="12"> ` : ''}<span${compact && flagNames[locale] ? ' class="hide-on-mobile"' : ''}>${escape(name)}</span>`;
  };
  const languages = config.languages.map(locale => {
    const path = state.route.path.replace(`/${state.route.locale}/`, `/${locale}/`);
    return `<li>${link(path, label(locale), `hreflang="${escape(locale)}"`)}</li>`;
  }).join('');
  return `<li class="nav-lang ${className}"><details role="list"><summary role="link" aria-label="${escape(t('tooltip.choose_language'))}"    ${window.PORTAL_LANG_BUTTON ? 'data-language-toggle' : ''}>${label(state.route.locale, true)}</summary>    <ul role="listbox">${languages}</ul></details></li>`;
}

function authLinks(className = '') {
  const lang = state.route.locale;
  const label = key => `<span${className ? '' : ' class="hide-on-mobile"'}>${escape(t(`menu.${key}`))}</span>`;
  return state.user ? `<li class="nav-admin ${className}">${link(`/${lang}/admin`, icon('admin') + label('admin'), `aria-label="${escape(t('menu.admin'))}"`)}</li>       <li class="nav-logout ${className}"><a href="${escape(href(`/${lang}/logout`))}" data-logout aria-label="${escape(t('menu.logout'))}">${icon('logout')}${label('logout')}</a></li>` : `<li class="nav-login ${className}">${link(`/${lang}/login`, icon('user') + label('login'), `aria-label="${escape(t('menu.login'))}"`)}</li>`;
}

export function icon(name) {
  const shapes = {
    chevronUp: '<path d="M3 15 12 6l9 9Z" fill="currentColor" stroke="none"/>',
    search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 7 7"/>',
    user: '<path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5Z" fill="currentColor" stroke="none"/>',
    admin: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/>',
    logout: '<path d="M9 3H3v18h6M9 12h13m-5-5 5 5-5 5"/>',
    expand: '<path d="M3 9V3h6m6 0h6v6m0 6v6h-6M9 21H3v-6M3 3l6 6m6 6 6 6M21 3l-6 6M9 15l-6 6"/>',
    layers: '<path d="m2 8 10-6 10 6-10 6Zm0 5 10 6 10-6M2 18l10 6 10-6"/>',
    edit: '<path d="m16 3 5 5-12 12-6 1 1-6Zm-2 2 5 5"/>',
    phone: '<path d="m5 3 4 5-3 3a16 16 0 0 0 7 7l3-3 5 4c-2 7-10 2-14-2S-2 5 5 3Z"/>',
    facebook: '<path d="M15 22v-8h3l.5-4H15V8c0-1.2.4-2 2-2h1.7V2.4C18 2.2 16.8 2 15.5 2 12.5 2 10.5 3.8 10.5 7v3H7v4h3.5v8Z"/>',
    twitter: '<path d="M4 4 20 20M20 4 4 20"/><path d="M4 4h4l12 16h-4z"/>',
    youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.6 6.8-4.2m-6.8 7 6.8 4.2"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/>',
    pin: '<path d="M20 9c0 6-8 13-8 13S4 15 4 9a8 8 0 1 1 16 0Z"/><circle cx="12" cy="9" r="3"/>',
  };
  return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${shapes[name]}</svg>`;
}

function logo() {
  const src = state.info.suite_logo;
  return `<img class="logo" src="${escape(src && !src.endsWith('/') ? safeURL(src) : asset('logo_g3wsuite-bw.png'))}" alt="${escape(state.info.title)}">`;
}

export function navbar() {
  const info = state.info;
  const top = window.PORTAL_NAVBAR_TOP !== false;
  const menu = top || window.PORTAL_MENU_BUTTON !== false;
  const orgName = window.PORTAL_ORG_NAME || info.suite_org_name || '';
  const orgImage = window.PORTAL_ORG_IMAGE || info.suite_org_image;
  const org = orgImage ? `<img class="logo" src="${escape(safeURL(orgImage))}" alt="${escape(orgName)}">` : escape(orgName);
  const orgURL = window.PORTAL_ORG_URL || info.suite_org_url;
  return `${top ? `<nav id="top-menu" class="container-fluid top-menu"><ul><li class="nav-org">    ${orgURL ? external(orgURL, org, `title="${escape(window.PORTAL_ORG_TITLE || '')}"`) : org}    </li></ul><ul>${authLinks()}${languageMenu()}</ul></nav>` : ''}    <nav id="main-menu" class="container-fluid main-menu${!top && !menu ? ' compact' : ''}${!top && menu ? ' mobile-menu' : ''}">      <ul><li class="nav-logo">${info.url_suite_logo ? external(info.url_suite_logo, logo(), 'aria-label="Back home"') : link(`/${state.route.locale}/`, logo(), 'aria-label="Back home"')}</li>      <li class="nav-title hide-on-mobile"><span class="h1">${escape(info.title)}</span><span>${escape(info.sub_title)}</span></li></ul>      <ul><li class="nav-search">${link(`/${state.route.locale}/search`, icon('search') + escape(t('menu.search')), `title="${escape(t('menu.search_placeholder'))}"`)}</li>      ${!top ? authLinks() + languageMenu() : ''}      ${menu ? `<li class="nav-toggle${!top ? ' show-on-mobile' : ''}"><button type="button" class="outline contrast" data-menu aria-controls="secondary-menu" aria-expanded="false">${escape(t('menu.toggle'))}</button></li>` : ''}</ul>      <ul id="secondary-menu" hidden>        <li>${link(`/${state.route.locale}/`, escape(t('menu.home')))}</li>        <li>${link(`/${state.route.locale}/group`, escape(t('menu.group')))}</li>        ${!top && menu ? `<li class="show-on-mobile">${link(`/${state.route.locale}/search`, icon('search') + escape(t('menu.search')))}</li>          ${authLinks('show-on-mobile')}          ${languageMenu('show-on-mobile')}` : ''}      </ul>    </nav>`;
}

export function footer() {
  const info = state.info;
  const contacts = [info.about_name ? `<p>${icon('user')}${escape(info.about_name)}</p>` : '', info.about_tel ? `<p>${external(`tel:${info.about_tel}`, icon('phone') + escape(info.about_tel))}</p>` : '', info.about_email ? `<p>${external(`mailto:${info.about_email}`, icon('mail') + escape(info.about_email))}</p>` : '', info.about_address ? `<p>${external(`https://maps.google.com/?q=${encodeURIComponent(info.about_address)}`, icon('pin') + escape(info.about_address), 'target="_blank" rel="noopener noreferrer"')}</p>` : '',].join('');
  const socials = ['facebook', 'twitter', 'googleplus', 'youtube', 'instagram', 'flickr', 'tripadvisor'].filter(name => info[`${name}_url`]).map(name => external(info[`${name}_url`], icon(['facebook', 'twitter', 'youtube'].includes(name) ? name : 'share'), `target="_blank" rel="noopener noreferrer" aria-label="${escape(name[0].toUpperCase() + name.slice(1))}"`)).join(' ');
  const policies = [
    [window.PORTAL_COOKIE_POLICY_URL || info.cookie_policy_url, 'Cookie'],
    [window.PORTAL_PRIVACY_POLICY_URL || info.privacy_policy_url, 'Privacy'],
  ].filter(([url]) => url).map(([url, label]) => `<li>${external(url, label, 'class="contrast"')}</li>`).join('');
  return `<footer id="footer" data-theme="dark"><section class="container"><div class="grid">    <div class="footer-about"><h2>${escape(info.about_title)}</h2>${rich(info.about_description)}</div>    <address><h3>${escape(t('footer.contacts'))}</h3>${contacts}<p class="social-icons">${socials}</p></address>    </div></section><nav><div class="container"><ul>${policies}    ${window.PORTAL_CREDITS_URL || info.credits_url ? '<li><a href="#credits" data-credits class="contrast">Credits</a></li>' : ''}</ul></div></nav></footer>`;
}

export function homeHeader() {
  const picture = state.pictures[0];
  return `<header id="header">${picture ? `<figure id="carousel"><img src="${escape(safeURL(picture.image))}" alt="">    <figcaption>${photoCredit(picture)}</figcaption></figure>` : ''}    ${state.info.home_description ? `<div class="container" data-theme="dark">${rich(state.info.home_description)}</div>` : ''}</header>`;
}

function photoCredit(picture) {
  return picture.author ? picture.author_url ? external(picture.author_url, `Photo by ${escape(picture.author)}`) : `<span>Photo by ${escape(picture.author)}</span>` : '';
}

export async function content(current) {
  const info = state.info;
  const heading = item => `<hgroup><h2>${escape(item.title || item.name)}</h2><div>${rich(item.description)}</div></hgroup>`;
  if (current.name === 'home') {
    const limit = Number(window.PORTAL_MAX_HOME_ARTICLES ?? 6);
    const cards = [...state.groups.map(item => groupCard(item)), ...state.macros.map(item => groupCard(item, true))];
    const max = !Number.isFinite(limit) || limit < 0 ? cards.length : limit;
    return {
      title: 'Home',
      html: `<div class="show-on-mobile"><span>${escape(info.sub_title)}</span><h1>${escape(info.title)}</h1></div>      <hgroup><h2>${escape(info.groups_title)}</h2><div>${rich(info.groups_map_description)}</div></hgroup>      <div class="grid catalog">${cards.slice(0, max).join('')}</div>      ${max > 0 && cards.length > max ? `<div id="load-more">${link(`/${current.locale}/group`, escape(t('home.show_all_button')), 'role="button"')}</div>` : ''}`
    };
  }
  if (current.name === 'login') return {
    title: t('menu.login'),
    html: `<article class="grid login-form"><div><h2>${escape(state.info.login_title || t('login.title'))}</h2>    <form id="login-form"><label for="username">${escape(t('login.username'))}</label>      <input id="username" name="username" placeholder="${escape(t('login.username'))}" autocomplete="username" required>      <label for="password">${escape(t('login.password'))}</label>      <input id="password" name="password" type="password" placeholder="${escape(t('login.password'))}" autocomplete="current-password" required>      <button type="submit" class="contrast">${escape(t('login.submit'))}</button>      ${Object.entries(state.info.social_auth_providers || {}).map(([name, url]) => external(url, escape(name), 'role="button" class="contrast outline social-login"')).join('')}      <p id="login-error" role="alert" hidden></p>      ${state.info.reset_password_url ? external(state.info.reset_password_url, escape(t('login.reset_password_url'))) : ''}    </form></div>${state.info.login_description ? `<div>${rich(state.info.login_description)}</div>` : ''}</article>`
  };
  if (current.name === 'search' || current.name === 'map') return {
    title: t('menu.search'),
    html: `<input type="search" id="search" aria-label="${escape(t('menu.search_placeholder'))}"      placeholder="${escape(t('menu.search_placeholder'))}" value="${escape(state.search)}"><div id="search-results">${projects(filteredProjects())}</div>`,
  };
  if (['group', 'organization'].includes(current.name)) {
    if (!current.id) return {
      title: t(`menu.${current.name}`),
      html: `<div class="grid catalog">${current.name === 'organization' ? state.macros.map(item => groupCard(item, true)).join('') : state.groups.map(item => groupCard(item)).concat(state.macros.map(item => groupCard(item, true))).join('')}</div>`
    };
    const macro = current.name === 'organization' && state.macros.find(item => String(item.id) === current.id);
    if (current.name === 'organization' && !macro) return missing(current);
    if (macro && !current.group) {
      const groups = await portal(current.locale, `/api/group/${current.id}`);
      return {
        title: macro.title,
        html: `${heading(macro)}<div class="grid catalog">${groups.map(item => groupCard(item)).join('')}</div>`
      };
    }
    const groups = macro ? await portal(current.locale, `/api/group/${current.id}`) : state.allGroups;
    const group = groups.find(item => String(item.id) === (current.group || current.id));
    if (!group) return missing(current);
    const items = await portal(current.locale, `/api/group/${group.id}/projects/`);
    state.visibleProjects = items;
    return {
      title: group.title || group.name,
      html: `${heading(group)}${projects(items)}`
    };
  }
  return {
    title: t('menu.404'),
    html: `<h1>${escape(t('menu.404'))}</h1>`
  };
}

function missing(current) {
  if (!state.user) return {
    redirect: `/${current.locale}/login?${new URLSearchParams({ next: current.path })}`
  };
  return {
    title: t('menu.404'),
    html: `<h1>${escape(t('menu.404'))}</h1>`
  };
}

export function filteredProjects() {
  const search = state.search.toLowerCase();
  return state.projects.filter(item => `${item.title || ''} ${item.description || ''}`.toLowerCase().includes(search));
}

export function showDialog(title, html) {
  const dialog = document.querySelector('#portal-dialog');
  dialog.innerHTML = `<article><header><form method="dialog"><input type="submit" aria-label="Close" value="" class="close contrast"></form>    <h3 id="dialog-title">${escape(title)}</h3></header>${html}</article>`;
  dialog.addEventListener('close', () => document.documentElement.classList.remove('modal-is-open'), {
    once: true
  });
  document.documentElement.classList.add('modal-is-open');
  dialog.showModal();
}