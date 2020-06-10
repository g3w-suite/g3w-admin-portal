import Vue from 'vue';
import App from './App.vue';
import router from './router';
import routerItalia from './routerItalia';
import store from './store';
import VueI18n from 'vue-i18n';
import BootstrapVue from 'bootstrap-vue';
import {it} from "@/lang/it";
import {en} from "@/lang/en";

// if (localStorage.getItem('isPA') === 'true') {
//     require('@/styles/appPA.scss');
// } else {
//     require('@/styles/app.scss');
// }


import {library} from '@fortawesome/fontawesome-svg-core';
import {
    faGooglePlusSquare,
    faFacebookSquare,
    faTwitterSquare,
    faInstagram,
    faLinkedin,
    faYoutube,
    faFlickr,
    faTripadvisor
} from '@fortawesome/free-brands-svg-icons';

import {
    faUserSecret,
    faKey,
    faMapMarkerAlt,
    faInbox,
    faNewspaper,
    faInfo,
    faUser,
    faUserLock,
    faLanguage,
    faPhoneAlt,
    faEnvelope,
    faExpandArrowsAlt,
    faTimes,
    faSignOutAlt,
    faPencilAlt,
    faUserShield,
    faSearch,
    faHome
} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome';
import {EnvironmentHelper} from "@/EnvironmentHelper";

library.add(
    faUserShield,
    faUserSecret,
    faKey,
    faMapMarkerAlt,
    faInbox,
    faNewspaper,
    faInfo,
    faUserLock,
    faLanguage,
    faPhoneAlt,
    faEnvelope,
    faUser,
    faFacebookSquare,
    faGooglePlusSquare,
    faYoutube,
    faFlickr,
    faTripadvisor,
    faTwitterSquare,
    faInstagram,
    faLinkedin,
    faExpandArrowsAlt,
    faTimes,
    faSignOutAlt,
    faPencilAlt,
    faSearch,
    faHome
);

Vue.use(BootstrapVue);
Vue.use(VueI18n);
Vue.component('font-awesome-icon', FontAwesomeIcon);

export const i18n = new VueI18n({
    locale: 'it',
    fallbackLocale: 'it',
    messages: {
        it,
        en,
    },
});

Vue.config.productionTip = false;

let IS_PA;

if (EnvironmentHelper.isProduction) {
    IS_PA = (window as any).IS_PA;
} else {
    IS_PA = localStorage.getItem('isPA') === 'true';
    (window as any).ADMIN_BTN = true;
    (window as any).PORTAL_SECTIONS = [
        'maps',
        'info',
        'news',
        'archives'
    ]
}

new Vue({
    router: (() => {
        if (IS_PA) {
            return routerItalia;
        } else {
            return router;
        }
    })(),
    store,
    i18n,
    render: (h) => h(App),
    created: () => {
        store.dispatch('info/fetchInfo',{locale:i18n.locale});
        store.dispatch('settings/portalSections', {sections: (window as any).PORTAL_SECTIONS});
        store.dispatch('settings/showAdminButton', {show: (window as any).ADMIN_BTN});
        store.dispatch('settings/fetchPictures',{locale:i18n.locale});
    }
}).$mount('#app');

if (IS_PA) {

    const btIta = document.createElement('link');

    btIta.setAttribute('rel', 'stylesheet');
    btIta.setAttribute('type', 'text/css');
    btIta.setAttribute('href', '/static/frontend/bootstrap-italia/css/bootstrap-italia.min.css');

    document.body.appendChild(btIta);

    document.body.classList.add('pa');
}
