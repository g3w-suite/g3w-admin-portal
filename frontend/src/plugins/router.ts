import * as Router from 'vue-router';

import config from '@/config';
import { useRootStore, useAuthStore, useDataStore } from '@/stores';
import { i18n } from '@/plugins';
import { App } from 'vue';


const { t: $t } = i18n.global;

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
      meta: {
        breadcrumb(route: Router.RouteLocationNormalized, app: App) {
          const { currentRoute } = app.config.globalProperties.$router;
          return 'home' === currentRoute.value.name
            ? { label: '', title: 'Home' }
            : { label: 'Home', title: '' }
        }
      },
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
            breadcrumb: 'Login'
          },
          beforeEnter: (...args) => useAuthStore().maybe_redirect(...args),
        },
        {
          path: 'logout/',
          name: 'logout',
          meta: {
            breadcrumb: 'Logout'
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
            breadcrumb: 'Search'
          },
        },
        {
          path: 'group/:id?/',
          name: 'group',
          component: () => import('@/views/Group.vue'),
          meta: {
            breadcrumb(route: Router.RouteLocationNormalized, app: App) {
              return route.params.id
                ? useDataStore().groups[parseInt(route.params.id as string)]?.title
                : $t('messages.menu.group');
            },
          },
        },
        {
          path: 'organization/:id?/:group?/',
          name: 'organization',
          component: () => import('@/views/MacroGroup.vue'),
          meta: {
            breadcrumb(route: Router.RouteLocationNormalized, app: App) {
              if (route.params.id) {
                if (route.params.group) {
                  return useDataStore().groups[parseInt(route.params.id  as string)]?.title;
                }
                return useDataStore().macroGroups[parseInt(route.params.id as string)]?.title;
              }
              // if(useRootStore().currentPage.params.id) {
              //   return {
              //     label: $t('messages.menu.group'),
              //     link: app.config.globalProperties.$router.resolve({name: 'group'}).href 
              //     // app.$router.resolve({
              //     //   name: 'group',
              //     //   params: { id: useRootStore().currentPage.params.group }
              //     // })
              //   }
              // }
              return $t('messages.menu.organization');
            },
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
            breadcrumb: '404',
          },
        },
      ],
    },
    /* Redirect root path to fallback language (it) */
    {
      path: '/',
      redirect(to) {
        return { path: `/it${to.path}` };
      }
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
  if (!config.languages.includes(to.params.lang as string)) {
    return next(`/it${to.path}`);                   // redirect to fallback language (it)
  } else {
    await useRootStore().setupPage(to, from);       // show current route content (view)
  }
  return next();
});

// router.beforeResolve(to => {
//   if (to.meta.requiresAuth && !isAuthenticated) return false
// })
