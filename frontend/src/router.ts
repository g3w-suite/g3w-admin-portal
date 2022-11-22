import Main from '@/components/Main.vue';
import { i18n } from '@/main';
import Home from '@/views/Home.vue';
import Login from '@/views/Login.vue';
import Vue from 'vue';
import Router from 'vue-router';
import store from './store';

// import About from '@/views/About.vue';
import Projects from '@/views/Projects.vue';
import Search from '@/views/Search.vue';
// import NotFound from '@/views/NotFound.vue';

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
        },
        {
          path: 'login/',
          name: 'login',
          component: Login,
        },
        {
          path: 'admin/',
          name: 'admin',
          beforeEnter() {
            location.href = store.getters['me/isLoggedIn']? 'http://127.0.0.1:8000' : '/';
          },
        },

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
        //   name: 'mappe',
        //   components: {
        //     // header: Header,
        //     default: Projects,
        //   },
        // },
        /**
         * @TODO MAPS ARCHIVE (maps/group/:id)
         */
        {
          path: 'maps/:name',
          name: 'mappe',
          component: Projects
        },
        {
          path: 'maps/group/:id',
          name: 'mappe',
          component: Projects,
        },
        {
          path: 'search/',
          name: 'search',
          component: Projects,
        },
        /**
         * @TODO 404 PAGE: https://v3.router.vuejs.org/guide/essentials/history-mode.html#caveat
         */
        // {
        //   // path: '/:catchAll(.*)',
        //   path: '404/',
        //   name: '404',
        //   components: {
        //     default: NotFound
        //   }
        // },
      ],
    },
  ],
  scrollBehavior (to, from, savedPosition) {
    if (to.hash) return { selector: to.hash, behavior: 'smooth', offset: { x: 0, y: 100 } }
  },
});

router.beforeEach((to, from, next) => {
  const lang = to.params.lang;
  if (!['en', 'it'].includes(lang)) { return next('/it'); }
  if (i18n.locale !== lang) { i18n.locale = lang; }
  // if (!to.matched.length) { return next(`/${lang}/404`); }
  const titlePrefix = '';
  const titleSuffix = ' | G3W-SUITE';
  const pageName = to.meta && to.meta.title ? to.meta.title : (((to.name as string)[0].toUpperCase() + (to.name as string).slice(1)));
  (document as any).title = titlePrefix + pageName + titleSuffix;
  return next();
});

export default router;
