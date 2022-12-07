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

/**
 * Used to set first time application ready
 */
let ready:Boolean = false;

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
 * handle data of group at
 * @param to
 * @param from
 * @param next
 */
const handleGroupBeforeEnter = async function(to, from, next) {
  const {id, group, lang} = to.params;
  // Home > Groups
  if (undefined === id) store.dispatch('group/setActiveGroup', { sg: null });
  else {
    const groups = store.getters['group/groups'];
    if (undefined !== group && undefined === groups[group]) {
      store.dispatch('showLoader');
      await store.dispatch('group/fetchGroupsByMacroGroupId', { id, locale: lang });
      store.dispatch('hideLoader');
    }
    const key = group || id;
    const activeGroup: Group = groups[key];
    await activeGroup.fetchProjects();
    store.dispatch('group/setActiveGroup', { sg: activeGroup });
    console.log('group')
  }
  next();
};
/**
 * handle data of MacroGroup at
 * @param to
 * @param from
 * @param next
 */
const handleMacroGroupBeforeEnter = async function(to: Object, from:Object, next:Function){
  const {id, group} = to.params;
  // Home > MacroGroups
  if (group || !id) {
    !id && store.dispatch('group/setActiveGroup', { sg: null });
    group && await handleGroupBeforeEnter(to, from, next);
  } else {
    const macroGroups = store.getters['group/macroGroups'];
    await (macroGroups[id] as MacroGroup).fetchGroups();
    store.dispatch('group/setActiveGroup', { sg: macroGroups[id] });
  }
  next();
};

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
          meta: {},
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
  !ready && await fetchData(lang);
  ready = true; // set tru after first time
  // listen for language change
  if (i18n.locale !== lang) {
    await fetchData(lang);
    i18n.locale = lang;
  }
  const {name} = to;
  switch(name) {
    case 'group':
      await handleGroupBeforeEnter(to, from, next);
      break;
    case 'organization':
      await handleMacroGroupBeforeEnter(to, from, next);
      break;
    default:
  }


  // update html lang attribute
  document.documentElement.lang = lang;

  // update body css class name
  if (to.name) { document.body.classList.add(to.name); }
  if (from.name && from.name !== to.name) { document.body.classList.remove(from.name); }

  return next();
});

export default router;
