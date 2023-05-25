import * as Router from 'vue-router';
import { useRootStore, useLangStore, useInfoStore, useAuthStore } from '@/stores';
import { get_admin_url } from '@/utils';
import config from '@/config';
import i18n from '@/i18n';


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
          path: ':catchAll(.*)',
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

  const { lang } = to.params;

  console.log(lang);

  // fallback to default language (it)
  if (!config.languages.includes(lang)) { return next(`/it${to.path}`); }

  // update html lang attribute
  await useLangStore().loadLanguageAsync(lang);

  // listen for language change
  if (!ready || i18n.global.locale !== lang) {
    await useRootStore().fetchData();
  }

  ready = true; // false = first time

  // update body css class name
  if (to.name) { document.body.classList.add(to.name); }
  if (from.name && from.name !== to.name) { document.body.classList.remove(from.name); }

  // update 'group/ActiveGroup' getter
  await useRootStore().setActiveGroup(/*to*/);

  return next();
});



export default router;
