import Vue from 'vue';
import Router from 'vue-router';
import {i18n} from '@/main';
import MainItalia from '@/views/MainItalia.vue';
import HeaderPA from '@/components/italia/HeaderPA.vue';
import TabWidget from '@/components/TabWidget.vue';
import AboutPA from '@/components/italia/AboutPA.vue';
import LoginPA from '@/components/italia/LoginPA.vue';
import Home from '@/components/Home.vue';

Vue.use(Router);

const routerItalia = new Router({
    // mode: 'history',
    base: process.env.BASE_URL,
    routes: [
        {
            path: '/:lang/',
            component: MainItalia,
            children: [
                {
                    path: 'home/',
                    name: 'home',
                    alias: '',
                    components: {
                        header: HeaderPA,
                        default: Home,
                    },
                },
                {
                    path: 'info/',
                    name: 'info',
                    components: {
                        header: HeaderPA,
                        default: AboutPA,
                    },
                },
                {
                    path: 'maps/',
                    name: 'mappe',
                    components: {
                        header: HeaderPA,
                        default: TabWidget,
                    },
                },
                {
                    path: 'login/',
                    name: 'login',
                    components: {
                        header: HeaderPA,
                        default: LoginPA,
                    },
                },
            ],
        },
    ],
});


routerItalia.beforeEach((to, from, next) => {
    const lang = to.params.lang;
    if (!['en', 'it'].includes(lang)) {
        return next('/it');
    }
    if (i18n.locale !== lang) {
        i18n.locale = lang;
    }
    return next();
});

export default routerItalia;
