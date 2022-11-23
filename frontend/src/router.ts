import Main from '@/components/Main.vue';
import { i18n } from '@/main';
import Vue from 'vue';
import Router, { Route } from 'vue-router';
import store from './store';
import config from './config';

import Home from '@/views/Home.vue';
import Login from '@/views/Login.vue';
import NotFound from '@/views/NotFound.vue';
import Projects from '@/views/Projects.vue';

Vue.use(Router);

const router = new Router({
  mode: 'history',
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
            breadcrumb: [
              { name: 'home', text: 'Home' }
            ]
          }
        },
        {
          path: 'login/',
          name: 'login',
          component: Login,
          meta: {
            breadcrumb: [
              { name: 'home', text: 'Home' },
              { name: 'login', text: 'Login' }
            ]
          }
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
            breadcrumb: [
              { name: 'home', text: 'Home' },
              { name: 'search', text: 'Search' }
            ]
          }
        },
        /**
         * @TODO MAPS ARCHIVE (maps/group/:id)
         */
        {
          path: 'maps/:group?/:id?/',
          name: 'maps',
          component: Projects,
          meta: {
            breadcrumb: [
              { name: 'home', text: 'Home' },
              { name: 'maps', text: 'Maps' }
            ]
          }
        },
        // {
        //   path: 'group/:id',
        //   name: 'group',
        //   component: Projects,
        // },
        // {
        //   path: 'info/',
        //   name: 'info',
        //   components: {
        //     // header: Header,
        //     default: About,
        //   },
        // },
        // {
        //   path: 'maps/',
        //   name: 'maps',
        //   components: {
        //     // header: Header,
        //     default: Projects,
        //   },
        // },
        /**
         * 404 PAGE
         * 
         * @link https://v3.router.vuejs.org/guide/essentials/history-mode.html#caveat
         */
        {
          path: ':catchAll(.*)',
          name: '404',
          component: NotFound,
          meta: {
            breadcrumb: [
              { name: 'home', text: 'Home' },
              { name: '404', text: '404' }
            ]
          }
        },
      ],
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) { return { selector: to.hash, behavior: 'smooth', offset: { x: 0, y: 100 } }; }
  },
});

function updateTitleTab(to: Route) : void {
  const titlePrefix = '';
  const titleSuffix = ' | ' + (store.getters['info/info'].title || 'G3W-SUITE');
  const pageName = to.meta && to.meta.title ? to.meta.title : (((to.name as string)[0].toUpperCase() + (to.name as string).slice(1)));
  (document as any).title = titlePrefix + pageName + titleSuffix;
}

router.beforeEach((to, from, next) => {
  const lang = to.params.lang;
  if (!config.languages.includes(lang)) return next(`/it${to.path}`);
  if (i18n.locale !== lang) { i18n.locale = lang; }
  store.subscribe((mutation) => 'info/setInfo' === mutation.type && updateTitleTab(to));
  updateTitleTab(to);
  return next();
});

export default router;
