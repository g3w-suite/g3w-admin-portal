import Main from '@/components/Main.vue';
import { i18n } from '@/main';
import Vue from 'vue';
import Router, { Route, RouterMode } from 'vue-router';
import config from './config';
import store from './store';

import Projects from '@/components/Projects.vue';
import Group from '@/views/Group.vue';
import Home from '@/views/Home.vue';
import Login from '@/views/Login.vue';
import MacroGroup from '@/views/MacroGroup.vue';
import NotFound from '@/views/NotFound.vue';
import Search from '@/views/Search.vue';

Vue.use(Router);

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

const router = new Router({
  mode: config.router_mode,
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/:lang/',
      component: Main,
      /** ensure that all mandatory information is loaded on first page load */
      async beforeEnter(to, from, next) {
        await fetchData(to.params.lang);
        next();
      },
      children: [
        {
          path: '/',
          name: 'home',
          alias: '',
          component: Home,
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

router.beforeEach(async (to, from, next) => {
  const lang = to.params.lang;

  // fallback to default language (it)
  if (!config.languages.includes(lang)) { return next(`/it${to.path}`); }

  // listen for language change
  if (i18n.locale !== lang) {
    await fetchData(lang);
    i18n.locale = lang;
  }

  // update html lang attribute
  document.documentElement.lang = lang;

  // update body css class name
  if (to.name) { document.body.classList.add(to.name); }
  if (from.name && from.name !== to.name) { document.body.classList.remove(from.name); }

  return next();
});

export default router;
