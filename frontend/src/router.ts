import * as Router from 'vue-router';

import config from '@/config';
import i18n from '@/i18n';

import {
  before_admin,
  before_login,
  before_logout,
  fetchData,
  setActiveGroup,
  loadLanguageAsync
} from '@/utils';

/**
 * @FIXME why do we need this?
 *
 * Used to set first time application ready
 */
let ready: boolean = false;


const modes = {
  "history": Router.createWebHistory,
  "hash": Router.createWebHashHistory,
  "abstract": Router.createMemoryHistory
};

/**
 * Vue Router
 */
const router = Router.createRouter({
  history: Router.createWebHashHistory(process.env.BASE_URL), // TODO: history: modes[config.router_mode](),
  routes: [
    {
      path: '/:lang/',
      component: () => import('@/components/Main.vue'),
      children: [
        {
          // path: '/',
          // alias: 'home',
          path: '',
          name: 'home',
          components: {
            default: () => import('@/views/Home.vue'),
            header: () => import('@/views/HomeHeader.vue'),
          },
          meta: {
          },
        },
        {
          path: 'login/',
          name: 'login',
          component: () => import('@/views/Login.vue'),
          meta: {
          },
          beforeEnter: before_login,
        },
        {
          path: 'logout/',
          name: 'logout',
          meta: {
          },
          component: () => import('@/views/Login.vue'),
          beforeEnter: before_logout,
        },
        {
          path: 'admin/',
          name: 'admin',
          beforeEnter: before_admin,
          component: () => import('@/views/NotFound.vue'),
        },
        {
          path: 'search/',
          name: 'search',
          component: () => import('@/views/Search.vue'),
          meta: {
          },
        },
        {
          path: 'group/:id?/',
          name: 'group',
          component: () => import('@/views/Group.vue'),
          meta: {
          },
        },
        {
          path: 'organization/:id?/:group?/',
          name: 'organization',
          component: () => import('@/views/MacroGroup.vue'),
          meta: {
          },
        },
        {
          path: 'map/:id?/',
          name: 'map',
          component: () => import('@/components/Projects.vue'),
          meta: {
          },
        },
        {
          /** @link https://v3.router.vuejs.org/guide/essentials/history-mode.html#caveat */
          path: ':catchAll(.*)',
          name: '404',
          component: () => import('@/views/NotFound.vue'),
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
      return new Promise((resolve) => setTimeout(() => resolve({ left: 0, top: 0 }), 500));
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
  if (!ready || i18n.global.locale !== lang) {
    await fetchData(lang);
  }

  ready = true; // false = first time

  // update html lang attribute
  await loadLanguageAsync(lang);

  // update body css class name
  if (to.name) { document.body.classList.add(to.name); }
  if (from.name && from.name !== to.name) { document.body.classList.remove(from.name); }

  // update 'group/ActiveGroup' getter
  await setActiveGroup(to);

  return next();
});



export default router;
