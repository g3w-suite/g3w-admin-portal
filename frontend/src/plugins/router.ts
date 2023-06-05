import * as Router from 'vue-router';

import config from '@/config';
import { useRootStore, useAuthStore, useDataStore } from '@/stores';
import { i18n } from '@/plugins';

const modes = {
  "history": Router.createWebHistory,
  "hash": Router.createWebHashHistory,
  "abstract": Router.createMemoryHistory
};

/**
 * Vue Router
 */
export const router = Router.createRouter({
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
          beforeEnter: (...args) => useAuthStore().maybe_redirect(...args),
        },
        {
          path: 'logout/',
          name: 'logout',
          meta: {
          },
          component: () => import('@/views/Login.vue'),
          beforeEnter: (...args) => useAuthStore().maybe_redirect(...args),
        },
        {
          path: 'admin/',
          name: 'admin',
          beforeEnter: (...args) => useAuthStore().maybe_redirect(...args),
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
          path: ':catchAll(.*)*',
          name: '404',
          component: () => import('@/views/NotFound.vue'),
          meta: {
          },
        },
      ],
    },
  ],
  /**
   * @param to.hash smooth scroll to element id
   * @param to.name smooth scroll to top after 500ms
   * 
   * @see https://v3.router.vuejs.org/guide/advanced/scroll-behavior.html
   */
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return { selector: to.hash, behavior: 'smooth', offset: { x: 0, y: 100 } };
    }
    if (to.name !== 'home') {
      return new Promise((resolve) => setTimeout(() => resolve({ left: 0, top: 0 }), 500));
    }
  },
});

/**
 * Apply some mixtures on each route change
 */
router.beforeEach(async (to, from, next) => {
  console.info('to', to);
  console.info('from', from);
  console.info('lang\n', to.params.lang);
  if (!config.languages.includes(to.params.lang as string)) {
    return next(`/it${to.path}`);                   // redirect to fallback language (it)
  } else {
    await useRootStore().setupPage(to, from);       // show current route content (view)
  }
  return next();
});