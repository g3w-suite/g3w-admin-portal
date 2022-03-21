import Vue from 'vue';
import Router from 'vue-router';
import Main from './views/Main.vue';
import Menu from '@/components/default/Menu.vue';
import AboutContent from '@/components/default/AboutContent.vue';
import Header from '@/components/default/Header.vue';
import LoginContent from '@/components/default/LoginContent.vue';
import MapsContent from '@/components/default/MapsContent.vue';
import HomeContent from '@/components/default/HomeContent.vue';
import {i18n} from '@/main';

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
                    path: 'home/',
                    name: 'home',
                    alias: '',
                    components: {
                        header: Header,
                        default: HomeContent,
                        menu: Menu,
                    },
                },
                {
                    path: 'info/',
                    name: 'info',
                    components: {
                        header: Header,
                        default: AboutContent,
                        menu: Menu,
                    },
                },
                {
                    path: 'maps/',
                    name: 'mappe',
                    components: {
                        header: Header,
                        default: MapsContent,
                        menu: Menu,
                    },
                },
                {
                    path: 'login/',
                    name: 'login',
                    components: {
                        header: Header,
                        default: LoginContent,
                        menu: Menu,
                    },
                },
            ],
        },
    ],
});

router.beforeEach((to, from, next) => {
    const lang = to.params.lang;
    if (!['en', 'it'].includes(lang)) {
        return next('/it');
    }
    if (i18n.locale !== lang) {
        i18n.locale = lang;
    }
    return next();
});

export default router;
