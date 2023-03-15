import Main from '@/components/Main.vue';
import { i18n } from '@/main';
import Vue from 'vue';
import Router, { Route, RouterMode } from 'vue-router';
import config from './config';
import store from './store';
import { Group } from './types/TGroup';
import { MacroGroup } from './types/TMacroGroup';

Vue.use(Router);

/**
 * @FIXME why do we need this?
 *
 * Used to set first time application ready
 */
let ready: boolean = false;

/**
 * Fetch some general application data
 */
const fetchData = async (locale: string) => {
  store.dispatch('showLoader');
  // @ts-ignore
  await Promise.allSettled([
    store.dispatch('info/fetchInfo', { locale }),
    store.dispatch('settings/fetchPictures', { locale }),
    store.dispatch('group/fetchMacroGroups', { locale }),
    store.dispatch('group/fetchGroupsWithNoMacroGroup', { locale }),
    store.dispatch('group/fetchProjects', { locale }),
  ]);
  store.dispatch('hideLoader');
};

/**
 * Make sure that 'group/ActiveGroup' getter is always set after each route change
 */
const setActiveGroup = async (to: Route) => {
  let sg: Group | MacroGroup | null = null;

  switch (to.name) {
    case 'group':
      sg = await fetchGroupData(to);
      break;
    case 'organization':
      sg = await fetchMacroGroupData(to);
      break;
  }

  store.dispatch('group/setActiveGroup', { sg });
};

/**
 * Fetch Group data based on route params
 *
 * @return a valid 'group/ActiveGroup' element
 */
const fetchGroupData = async (to: Route): Promise<Group | null> => {
  const {id, group, lang} = to.params;

  // Home > Group
  if (undefined !== id) {
    const groups = store.getters['group/groups'];
    if (undefined !== group && undefined === groups[group]) {
      store.dispatch('showLoader');
      await store.dispatch('group/fetchGroupsByMacroGroupId', { id, locale: lang });
      store.dispatch('hideLoader');
    }
    const activeGroup: Group = groups[group || id];
    await activeGroup.fetchProjects();
    return activeGroup;
  }
  return null;
};

/**
 * Fetch MacroGroup data based on route params
 *
 * @return a valid 'group/ActiveGroup' element
 */
const fetchMacroGroupData = async (to: Route): Promise<Group | MacroGroup | null> => {
  const { id, group } = to.params;

  // Home > MacroGroup
  if (!group && id) {
    const macroGroups = store.getters['group/macroGroups'];
    await (macroGroups[id] as MacroGroup).fetchGroups();
    return macroGroups[id];
  } else if (group) {
    return await fetchGroupData(to);
  }
  return null;
};

/**
 * Refresh data on user Login / Logout
 */
store.subscribe((mutation, state) => {
  if (mutation.type === 'me/setUser') {
    store
      .dispatch('group/reset')
      .then(() => fetchData(i18n.locale))
      .then(() => setActiveGroup(router.currentRoute));
  }
});

/**
 * Vue Router
 */
const router = new Router({
  mode: config.router_mode,
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/:lang/',
      component: Main,
      children: [
        {
          path: '/',
          name: 'home',
          alias: '',
          components: {
            default: () => import(/* webpackChunkName: "portal-core" */ '@/views/Home.vue'),
            header: () => import(/* webpackChunkName: "portal-core" */ '@/views/HomeHeader.vue'),
          },
          meta: {
          },
        },
        {
          path: 'login/',
          name: 'login',
          component: () => import(/* webpackChunkName: "portal-user" */ '@/views/Login.vue'),
          meta: {
          },
          beforeEnter(to, from, next) {
            // redirect to custom login page
            const { login_url } = store.getters['info/info'];
            if ('login' !== login_url) {
              location.href = login_url;
              return false;
            }
            // default login
            next();
          },
        },
        {
          path: 'admin/',
          name: 'admin',
          beforeEnter() {
            location.href = store.getters['me/isLoggedIn'] ? config.admin_url : '/';
          },
        },
        {
          path: 'search/',
          name: 'search',
          component: () => import(/* webpackChunkName: "portal-catalog" */ '@/views/Search.vue'),
          meta: {
          },
        },
        {
          path: 'group/:id?/',
          name: 'group',
          component: () => import(/* webpackChunkName: "portal-catalog" */ '@/views/Group.vue'),
          meta: {
          },
        },
        {
          path: 'organization/:id?/:group?/',
          name: 'organization',
          component: () => import(/* webpackChunkName: "portal-catalog" */ '@/views/MacroGroup.vue'),
          meta: {
          },
        },
        {
          path: 'map/:id?/',
          name: 'map',
          component: () => import(/* webpackChunkName: "portal-catalog" */ '@/components/Projects.vue'),
          meta: {
          },
        },
        {
          /** @link https://v3.router.vuejs.org/guide/essentials/history-mode.html#caveat */
          path: ':catchAll(.*)',
          name: '404',
          component: () => import(/* webpackChunkName: "portal-core" */ '@/views/NotFound.vue'),
          meta: {
          },
        },
      ],
    },
  ],
  /** @link https://v3.router.vuejs.org/guide/advanced/scroll-behavior.html */
  scrollBehavior(to, from, savedPosition) {
    // smooth scroll to element id
    if (to.hash) {
      return { selector: to.hash, behavior: 'smooth', offset: { x: 0, y: 100 } };
    }
    // smooth scroll to top after 500ms
    if (to.name !== 'home') {
      return new Promise((resolve) => setTimeout(() => resolve({ x: 0, y: 0 }), 500));
    }
  },
});

/**
 * Apply some mixtures on each route change
 */
router.beforeEach(async (to, from, next) => {
  const lang = to.params.lang;

  // fallback to default language (it)
  if (!config.languages.includes(lang)) { return next(`/it${to.path}`); }

  // listen for language change
  if (!ready || i18n.locale !== lang) {
    await fetchData(lang);
  }

  ready = true; // false = first time

  // update html lang attribute
  document.documentElement.lang = i18n.locale = lang;

  // update body css class name
  if (to.name) { document.body.classList.add(to.name); }
  if (from.name && from.name !== to.name) { document.body.classList.remove(from.name); }

  // update 'group/ActiveGroup' getter
  await setActiveGroup(to);

  return next();
});

export default router;
