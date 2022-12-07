import Main from '@/components/Main.vue';
import { i18n } from '@/main';
import Vue from 'vue';
import Router, { Route, RouterMode } from 'vue-router';
import config from './config';
import store from './store';

import Projects from '@/components/Projects.vue';
import Group from '@/views/Group.vue';
import Home from '@/views/Home.vue';
import HomeHeader from '@/views/HomeHeader.vue';
import Login from '@/views/Login.vue';
import MacroGroup from '@/views/MacroGroup.vue';
import NotFound from '@/views/NotFound.vue';
import Search from '@/views/Search.vue';
import { SuperGroup } from './types/TSuperGroup';

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
const fetchData = async function(locale: string) {
  store.dispatch('showLoader');
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
 * Make sure that 'group/ActiveGroup' is getter is always set afetr each route change
 */
const setActiveGroup = async function(to: Route) {
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
const fetchGroupData = async function(to: Route): Promise<Group | null> {
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
const fetchMacroGroupData = async function(to: Route): Promise<Group | MacroGroup | null> {
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
            default: Home,
            header: HomeHeader,
          },
          meta: {
          },
        },
        {
          path: 'login/',
          name: 'login',
          component: Login,
          meta: {
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
          component: Search,
          meta: {
          },
        },
        {
          path: 'group/:id?/',
          name: 'group',
          component: Group,
          meta: {
          },
        },
        {
          path: 'organization/:id?/:group?/',
          name: 'organization',
          component: MacroGroup,
          meta: {
          },
        },
        {
          path: 'map/:id?/',
          name: 'map',
          component: Projects,
          meta: {
          },
        },
        {
          /** @link https://v3.router.vuejs.org/guide/essentials/history-mode.html#caveat */
          path: ':catchAll(.*)',
          name: '404',
          component: NotFound,
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
    i18n.locale = lang;
  }

  ready = true; // false = first time

  // update html lang attribute
  document.documentElement.lang = lang;

  // update body css class name
  if (to.name) { document.body.classList.add(to.name); }
  if (from.name && from.name !== to.name) { document.body.classList.remove(from.name); }

  // update 'group/ActiveGroup' getter
  await setActiveGroup(to);

  return next();
});

export default router;
