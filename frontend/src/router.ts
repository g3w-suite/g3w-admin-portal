import Main from '@/components/Main.vue';
import { i18n } from '@/main';
import Vue from 'vue';
import Router, { Route } from 'vue-router';
import config from './config';
import store from './store';

import Home from '@/views/Home.vue';
import Login from '@/views/Login.vue';
import NotFound from '@/views/NotFound.vue';
import Projects from '@/views/Projects.vue';

Vue.use(Router);

const router = new Router({
  // mode: 'history',
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
            location.href = store.getters['me/isLoggedIn'] ? 'http://127.0.0.1:8000' : '/';
          },
        },
        {
          path: 'search/',
          name: 'search',
          component: Projects,
          meta: {
          },
        },
        {
          path: 'group/:id?/',
          name: 'group',
          component: Projects,
          meta: {
          },
        },
        {
          path: 'organization/:id?/',
          name: 'organization',
          component: Projects,
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
        /**
         * @link https://v3.router.vuejs.org/guide/essentials/history-mode.html#caveat
         */
        {
          path: ':catchAll(.*)',
          name: '404',
          component: NotFound,
          meta: {
          },
        },
      ],
    },
  ],
  /**
   * @link https://v3.router.vuejs.org/guide/advanced/scroll-behavior.html
   */
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) { return { selector: to.hash, behavior: 'smooth', offset: { x: 0, y: 100 } }; }
  },
});

router.beforeEach((to, from, next) => {
  const lang = to.params.lang;
  if (!config.languages.includes(lang)) { return next(`/it${to.path}`); }
  if (i18n.locale !== lang) { 
    i18n.locale = lang;
    /**
     * @TODO dispatch a "changeLanguage" action or make use of "i18n.locale" within REST API calls
     */
    store.dispatch('info/fetchInfo', { locale: i18n.locale });
    store.dispatch('settings/fetchPictures', { locale: i18n.locale });
  }
  return next();
});

export default router;
