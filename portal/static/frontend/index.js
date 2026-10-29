import { config, adminURL, login, logout, portal, tokens } from './api.js';
import { state } from './state.js';
import { asset, content, escape, external, fallback, filteredProjects, footer, href, homeHeader, icon, link, navbar, projects, rich, safeURL, showDialog, t } from './views.js';

let route;
let navigation = 0;
let carousel;
let memoryPath = '/';

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
  const path = config.mode === 'abstract' ? memoryPath : config.mode === 'hash' ? location.hash.slice(1) || '/' : location.pathname + location.search;
  const url = new URL(path, location.origin);
  const parts = url.pathname.split('/').filter(Boolean);
  const locale = config.languages.includes(parts[0]) ? parts.shift() : fallback;
  const [name = 'home', id, group, ...extra] = parts;
  const known = ['home', 'login', 'logout', 'admin', 'search', 'group', 'organization', 'map'];
  const valid = known.includes(name) && !extra.length && (name === 'organization' || !group) && (['organization', 'group', 'map'].includes(name) || !id);
  return {
    locale,
    name: valid ? name : '404',
    id,
    group,
    path: `/${locale}/${parts.join('/')}${url.search}`,
    query: url.searchParams,
  };
}
async function load(locale) {
  const [info, pictures, macros, groups, allGroups, projects] = await Promise.all([portal(locale, '/api/infodata/'), portal(locale, '/api/pictures/'), portal(locale, '/api/macrogroup/'), portal(locale, '/api/group/nomacrogroup/'), portal(locale, '/api/group/'), portal(locale, '/api/project/'),]);
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
  const user = await portal(locale, '/api/whoami/');
  if (config.auth === 'cookie' || !user.is_authenticated) tokens();
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
  retry.onclick = () => {
    state.locale = '';
    render();
  };
  alert.append(retry);
}
async function render() {
  const version = ++navigation;
  const current = parseRoute();
  route = current;
  state.route = current;
  try {
    if (state.locale !== current.locale) {
      const locale = ['en', 'it', 'fr', 'de', 'bg', 'fi', 'pt', 'ro', 'se'].includes(current.locale) ? current.locale : 'en';
      const [translation, data, user] = await Promise.all([import(`./locale/${locale}.js`), load(current.locale), whoami(current.locale),]);
      if (version !== navigation) return;
      state.messages = translation.default;
      Object.assign(state, data, {
        user
      });
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
    mount(`<button type="button" class="skip-link" data-skip-content>Skip to content</button>${navbar()}      ${current.name === 'home' ? homeHeader() : ''}            <nav id="breadcrumb" class="container" aria-label="breadcrumb"><ul>        <li>${link(`/${current.locale}/`, current.name === 'home' ? '' : 'Home', current.name === 'home' ? `aria-current="page" aria-label="${escape(t('menu.home'))}"` : '')}</li>        ${['group', 'organization'].includes(current.name) && current.id ? `<li>${link(`/${current.locale}/${current.name}`, escape(t(`menu.${current.name}`)))}</li>` : ''}        ${current.name === 'organization' && current.group ? `<li>${link(`/${current.locale}/organization/${current.id}`, escape(state.macros.find(item => String(item.id) === current.id)?.title))}</li>` : ''}        ${current.name !== 'home' ? `<li aria-current="page">${escape(page.title)}</li>` : ''}      </ul></nav><main id="content" class="container" tabindex="-1">${page.html}</main>${footer()}      <dialog id="portal-dialog" aria-labelledby="dialog-title" data-theme="light"></dialog>      <a class="bottom-right" href="#" data-scroll-top title="Back to top" aria-label="Back to top" hidden>${icon('chevronUp')}</a>`);
    document.querySelector('#search')?.addEventListener('input', event => {
      state.search = event.target.value;
      document.querySelector('#search-results').innerHTML = projects(filteredProjects());
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
        const next = returnPath(route.query.get('next') || new URL(location.href).searchParams.get('next') || `/${route.locale}/`);
        if (['Bearer', 'JWT'].includes(config.auth) && state.user.drf_token) {
          const url = new URL(`${route.locale}/portal/api/whoami/`, config.base);
          const redirect = new URL(href(next), location.href);
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
        await navigate(next);
      } catch (error) {
        console.error('Portal login:', error);
        errorLabel.textContent = `${t('login.erroreLogin')}: ${error.message}`;
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
        document.querySelector('#carousel figcaption').innerHTML = picture.author ? picture.author_url ? external(picture.author_url, `Photo by ${escape(picture.author)}`) : `<span>Photo by ${escape(picture.author)}</span>` : '';
      }, 5000);
    }
  } catch (error) {
    if (version === navigation) showError(error);
  }
}
async function doLogout() {
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
    if (route.name === 'logout') await navigate(`/${route.locale}/`, true);
    else await render();
  } catch (error) {
    showError(error);
  }
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
    const items = ['group', 'organization'].includes(route.name) ? state.visibleProjects : state.projects;
    const item = items.find(item => String(item.id) === target.dataset.services);
    showDialog(item.title, `<h4>${escape(t('ogc_services'))}      ${external(`https://docs.qgis.org/3.34/${route.locale}/docs/server_manual/services.html`, '&#x2139;', 'target="_blank" rel="noopener noreferrer" aria-label="QGIS documentation"')}</h4><ul>${Object.entries(item.ogc_urls).map(([name, url]) => `<li><b>${escape(name)}:</b> ${external(url, escape(safeURL(url)), 'target="_blank" rel="noopener noreferrer"')}</li>`).join('')}</ul>`);
  } else if (target.hasAttribute('data-credits')) {
    event.preventDefault();
    showDialog('Applicativo realizzato con il framework Open Source', `<section class="credits-content"><p>${external('https://g3wsuite.it/', `<img src="${asset('logo_g3wsuite.png')}" alt="G3W SUITE" width="250">`, 'target="_blank" rel="noopener noreferrer"')}</p>      <p>Pubblica e gestisci i tuoi progetti QGIS sul Web</p>      <address>${external('https://maps.google.com/?q=Montecatini%20Terme%2C%20Italy', icon('pin') + 'Montecatini Terme - Italy', 'target="_blank" rel="noopener noreferrer"')}        ${external('tel:+393938534336', icon('phone') + '+39 393 8534336')}${external('mailto:info@gis3w.it', icon('mail') + 'info@gis3w.it')}</address>      ${rich(state.info.credits)}</section><footer>Framework sviluppato da ${external('https://www.gis3w.it', `<img src="${asset('logo_gis3w_156_85.png')}" alt="Gis3w" width="60">`, 'target="_blank" rel="noopener noreferrer"')}</footer>`);
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