import Main from '@/components/Main.vue';
import config from '@/config';
import { i18n } from '@/main';
import store from '@/store';
import { fetchData, get_admin_url, setActiveGroup } from '@/utils';
import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

/**
 * @FIXME why do we need this?
 *
 * Used to set first time application ready
 */
let ready: boolean = false;

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
            location.href = get_admin_url(config.admin_root);
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
