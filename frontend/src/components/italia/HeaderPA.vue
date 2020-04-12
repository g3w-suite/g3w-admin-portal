<template>
    <div class="it-header-slim-wrapper">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <div class="it-header-slim-wrapper-content">
                        <a class="d-none d-lg-block navbar-brand" href="#">Gis3w</a>
                        <div class="nav-mobile">
                            <nav>
                                <a class="it-opener d-lg-none" data-toggle="collapse" href="#menu1" role="button"
                                   aria-expanded="false" aria-controls="menu1">
                                    <span>Gis3w</span>
                                    <svg class="icon">
                                        <use xlink:href="/static/frontend/bootstrap-italia/svg/sprite.svg#it-expand"></use>
                                    </svg>
                                </a>
                                <div class="link-list-wrapper collapse" id="menu1">
                                    <ul class="link-list">
                                        <li>
                                            <router-link class="list-item text-capitalize" :to="{name:'home'}"
                                                         :class="{'active' : $route.name === 'home' }">
                                                {{$t("messages.menu.home")}}
                                            </router-link>
                                        </li>
                                        <li>
                                            <router-link class="list-item text-capitalize" :to="{name:'mappe'}"
                                                         :class="{'active' : $route.name === 'mappe' }"
                                            >
                                                {{$t("messages.menu.mappe")}}
                                            </router-link>
                                        </li>
                                        <li>
                                            <router-link class="list-item text-capitalize" :to="{name:'info'}"
                                                         :class="{'active' : $route.name === 'info' }">
                                                {{$t("messages.menu.info")}}
                                            </router-link>
                                        </li>
<!--                                        <li>-->
<!--                                            <router-link v-if="!someoneIsLogged" class="list-item text-capitalize" :to="{name:'login'}"-->
<!--                                                         :class="{'active' : $route.name === 'login' }">-->
<!--                                                {{$t("messages.menu.login")}}-->
<!--                                            </router-link>-->
<!--                                        </li>-->
                                    </ul>
                                </div>
                            </nav>
                        </div>
                        <div class="it-header-slim-right-zone">
                            <div class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown"
                                   aria-expanded="false">
                                    <span>{{$t('messages.language.' + $i18n.locale)}}</span>
                                    <svg class="icon d-none d-lg-block">
                                        <use xlink:href="/static/frontend/bootstrap-italia/svg/sprite.svg#it-expand"></use>
                                    </svg>
                                </a>
                                <div class="dropdown-menu">
                                    <div class="row">
                                        <div class="col-12">
                                            <div class="link-list-wrapper">
                                                <ul class="link-list">
                                                    <li>
                                                        <router-link class="list-item"
                                                                     :to="{ name: 'home', params: { lang: 'it' } }">
                                                            <span>{{$t("messages.language.it")}}</span></router-link>
                                                    </li>
                                                    <li>
                                                        <router-link  class="list-item"
                                                                     :to="{ name: 'home', params: { lang: 'en' } }">
                                                            <span>{{$t("messages.language.en")}}</span></router-link>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="it-access-top-wrapper">
                                <router-link v-if="!someoneIsLogged" :to="{name:'login'}">
                                    <button class="btn btn-primary btn-sm">{{$t("messages.menu.login")}}</button>
                                </router-link>
                                <button v-else @click="logout" class="btn btn-primary btn-sm" type="button">{{$t("messages.menu.logout")}}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';

@Component({
    components: {},
})

export default class HeaderPA extends Vue {

    get whoIs() {
        return this.$store.getters['me/me'];
    }

    get someoneIsLogged() {
        return this.$store.getters['me/someoneIsLogged'];
    }

    public logout() {
        const locale = this.$i18n.locale;
        this.$store.dispatch('me/logout', {locale});
        this.$store.dispatch('group/reset');
        if (this.$route.name !== 'home') {
            this.$router.push({name: 'home'});
        }
        this.$store.dispatch('menu/setVisibility', {v: false});
    }

    public mounted() {
        // appena apro la barra guardo se c'e' qualcuno loggato
        this.$store.dispatch('me/fetchWhoAmI');
    }
}
</script>

<style lang="scss" scoped>

</style>
