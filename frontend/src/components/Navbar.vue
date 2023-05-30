<template>
  <!-- TOP MENU -->
  <nav id="top-menu" class="container-fluid top-menu" v-if="hasNavBarTop">

    <!-- ORGANIZATION NAME -->
    <ul>
      <li v-if="info.suite_org_url" class="nav-org">
        <a :href="info.suite_org_url">
          <font-awesome-icon icon="arrow-up-right-from-square" size="sm" /> {{info.suite_org_name}}
        </a>
      </li>
    </ul>

    <ul>

      <!-- ADMIN LINK -->
      <li v-if="isLoggedIn" class="nav-admin">
        <router-link :to="{ name: 'admin' }" :title="$t('messages.tooltip.admin')" class="secondary">
          <font-awesome-icon icon="gear" size="lg" />
          <span class="hide-on-mobile"> {{$t('messages.menu.admin')}}</span>
        </router-link>
      </li>

      <!-- LOGOUT LINK -->
      <li v-if="isLoggedIn" class="nav-logout">
        <a href="#" @click.prevent="logout" :title="$t('messages.tooltip.logout')" class="secondary">
          <font-awesome-icon icon="sign-out-alt" size="lg" />
          <span class="hide-on-mobile"> {{$t('messages.menu.logout')}}</span>
        </a>
      </li>

      <!-- LOGIN LINK -->
      <li v-else  class="nav-login">
        <router-link :to="{ name: 'login' }" :title="$t('messages.tooltip.login')" class="secondary">
          <font-awesome-icon icon="user" size="lg" />
          <span class="hide-on-mobile"> {{$t('messages.menu.login')}}</span>
        </router-link>
      </li>

      <!-- LANGUAGE SELECTOR -->
      <li class="nav-lang">
        <details role="list" dir="ltr" :title="$t('messages.tooltip.choose_language')">
          <summary aria-haspopup="listbox" role="link" class="secondary">
            <img :alt="$t('messages.tooltip.choose_language')" :title="$t('messages.language.' + $i18n.locale)" width="18" height="12" style="margin: 1ch 1ch 1ch 0;" :src="$i18n.locale === 'it' ? flag_it : flag_en" />
            <span class="hide-on-mobile">{{$t('messages.language.' + $i18n.locale)}}</span>
          </summary>
          <ul role="listbox">
            <li>
              <router-link :to="{ name: 'home', params: { lang: 'it' } }" hreflang="it" class="secondary">
                <img alt="it_IT" title="Italiano" width="18" height="12" style="margin: 1ch 1ch 1ch 0;" :src="flag_it" />
                <span>{{$t('messages.language.it')}}</span>
              </router-link>
            </li>
            <li>
              <router-link :to="{ name: 'home', params: { lang: 'en' } }" hreflang="en" class="secondary">
                <img alt="en_GB" title="English" width="18" height="12" style="margin: 1ch 1ch 1ch 0;" :src="flag_en" />
                <span>{{$t('messages.language.en')}}</span>
              </router-link>
            </li>
          </ul>
        </details>
      </li>

      </ul>

  </nav>

  <!-- MAIN MENU -->
  <nav id="main-menu" class="container-fluid main-menu">

    <ul>

      <!-- LOGO -->
      <li class="nav-logo">
        <router-link :to="{ name:'home' }" aria-label="Back home" class="secondary">
          <img :src="info.suite_logo || info.url_suite_logo || g3w_logo" :alt="info.title" class="logo" />
        </router-link>
      </li>

      <!-- TITLE -->
      <li class="nav-title hide-on-mobile">
        <span class="h1">{{info.title}}</span>
        <span>{{info.sub_title}}</span>
      </li>

    </ul>

    <ul>

      <!-- SEARCH LINK -->
      <li class="nav-search" :class="{'hide-on-mobile': hasMenuButton && !hasNavBarTop }">
        <router-link :to="{ name: 'search' }" :title="$t('messages.menu.search_placeholder')" class="contrast outline">
          <font-awesome-icon icon="search" size="lg" />
          <span>{{ $t('messages.menu.search') }}</span>
        </router-link>
      </li>

      <!-- ADMIN LINK -->
      <li v-if="!hasNavBarTop && isLoggedIn" class="nav-admin" :class="{'hide-on-mobile': hasMenuButton && !hasNavBarTop }">
        <router-link :to="{ name: 'admin' }" :title="$t('messages.tooltip.admin')" class="secondary">
          <font-awesome-icon icon="gear" size="lg" />
          <span class="hide-on-mobile"> {{$t('messages.menu.admin')}}</span>
        </router-link>
      </li>

      <!-- LOGOUT LINK -->
      <li v-if="!hasNavBarTop && isLoggedIn" class="nav-logout" :class="{'hide-on-mobile': hasMenuButton && !hasNavBarTop }">
        <a href="#" @click.prevent="logout" :title="$t('messages.tooltip.logout')" class="secondary">
          <font-awesome-icon icon="sign-out-alt" size="lg" />
          <span class="hide-on-mobile"> {{$t('messages.menu.logout')}}</span>
        </a>
      </li>

      <!-- LOGIN LINK -->
      <li v-else-if="!hasNavBarTop" class="nav-login" :class="{'hide-on-mobile': hasMenuButton && !hasNavBarTop }">
        <router-link :to="{ name: 'login' }" :title="$t('messages.tooltip.login')" class="secondary">
          <font-awesome-icon icon="user" size="lg" />
          <span class="hide-on-mobile"> {{$t('messages.menu.login')}}</span>
        </router-link>
      </li>

      <!-- LANGUAGE SELECTOR -->
      <li v-if="!hasNavBarTop" class="nav-lang" :class="{'hide-on-mobile': hasMenuButton && !hasNavBarTop }">
        <details role="list" dir="ltr" :title="$t('messages.tooltip.choose_language')" @click="switchLang">
          <summary aria-haspopup="listbox" role="link" class="secondary">
            <img :alt="$t('messages.tooltip.choose_language')" :title="$t('messages.language.' + $i18n.locale)" width="18" height="12" style="margin: 1ch 1ch 1ch 0;" :src="$i18n.locale === 'it' ? flag_it : flag_en" />
            <span class="hide-on-mobile">{{$t('messages.language.' + $i18n.locale)}}</span>
          </summary>
          <ul role="listbox">
            <li>
              <router-link :to="{ name: 'home', params: { lang: 'it' } }" hreflang="it" class="secondary">
                <img alt="it_IT" title="Italiano" width="18" height="12" style="margin: 1ch 1ch 1ch 0;" :src="flag_it" />
                <span>{{$t('messages.language.it')}}</span>
              </router-link>
            </li>
            <li>
              <router-link :to="{ name: 'home', params: { lang: 'en' } }" hreflang="en" class="secondary">
                <img alt="en_GB" title="English" width="18" height="12" style="margin: 1ch 1ch 1ch 0;" :src="flag_en" />
                <span>{{$t('messages.language.en')}}</span>
              </router-link>
            </li>
          </ul>
        </details>
      </li>

      <!-- MENU LINK -->
      <li v-if="hasMenuButton" class="nav-toggle" :class="{'show-on-mobile': hasMenuButton && !hasNavBarTop }">
        <button @click="toggleSecondaryMenu" :title="$t('messages.tooltip.menu')" class="contrast outline">
          <font-awesome-icon :icon="secondaryMenuVisible ? 'bars' : 'xmark'" size="lg" />
          <span>{{ $t('messages.menu.toggle') }}</span>
        </button>
      </li>
    </ul>

    <ul :class="{ 'active': !secondaryMenuVisible }">

      <li class="nav-home" :class="{'active': 'home' === $route.name }">
          <router-link :to="{ name: 'home' }" class="secondary" :title="$t('messages.tooltip.home')">
            {{ $t('messages.menu.home') }}
          </router-link>
      </li>

      <li class="nav-group" :class="{'active': 'group' === $route.name }">
        <router-link :to="{ name: 'group' }" class="secondary">
          {{ $t('messages.menu.group') }}
        </router-link>
      </li>

      <!-- <li class="nav-org" :class="{'active': 'organization' === $route.name }">
        <router-link :to="{ name: 'organization' }" class="secondary">
          {{ $t('messages.menu.organization') }}
        </router-link>
      </li> -->

      <!-- SEARCH LINK -->
      <li class="nav-search" :hidden="!(hasMenuButton && !hasNavBarTop)">
        <router-link :to="{ name: 'search' }" :title="$t('messages.menu.search_placeholder')" class="contrast outline">
          <font-awesome-icon icon="search" size="lg" />
          <span>{{ $t('messages.menu.search') }}</span>
        </router-link>
      </li>

      <!-- ADMIN LINK -->
      <li v-if="isLoggedIn" :hidden="!(hasMenuButton && !hasNavBarTop)" class="nav-admin">
        <router-link :to="{ name: 'admin' }" :title="$t('messages.tooltip.admin')" class="secondary">
          <font-awesome-icon icon="gear" size="lg" />
          <span> {{$t('messages.menu.admin')}}</span>
        </router-link>
      </li>

      <!-- LOGOUT LINK -->
      <li v-if="isLoggedIn" :hidden="!(hasMenuButton && !hasNavBarTop)" class="nav-logout">
        <a href="#" @click.prevent="logout" :title="$t('messages.tooltip.logout')" class="secondary">
          <font-awesome-icon icon="sign-out-alt" size="lg" />
          <span> {{$t('messages.menu.logout')}}</span>
        </a>
      </li>

      <!-- LOGIN LINK -->
      <li v-else :hidden="!(hasMenuButton && !hasNavBarTop)" class="nav-login">
        <router-link :to="{ name: 'login' }" :title="$t('messages.tooltip.login')" class="secondary">
          <font-awesome-icon icon="user" size="lg" />
          <span> {{$t('messages.menu.login')}}</span>
        </router-link>
      </li>

      <!-- LANGUAGE SELECTOR -->
      <li :hidden="!(hasMenuButton && !hasNavBarTop)" class="nav-lang">
        <details role="list" dir="ltr" :title="$t('messages.tooltip.choose_language')" @click="switchLang">
          <summary aria-haspopup="listbox" role="link" class="secondary">
            <img :alt="$t('messages.tooltip.choose_language')" :title="$t('messages.language.' + $i18n.locale)" width="18" height="12" style="margin: 1ch 1ch 1ch 0;" :src="$i18n.locale === 'it' ? flag_it : flag_en" />
            <span>{{$t('messages.language.' + $i18n.locale)}}</span>
          </summary>
          <ul role="listbox">
            <li>
              <router-link :to="{ name: 'home', params: { lang: 'it' } }" hreflang="it" class="secondary">
                <img alt="it_IT" title="Italiano" width="18" height="12" style="margin: 1ch 1ch 1ch 0;" :src="flag_it" />
                <span>{{$t('messages.language.it')}}</span>
              </router-link>
            </li>
            <li>
              <router-link :to="{ name: 'home', params: { lang: 'en' } }" hreflang="en" class="secondary">
                <img alt="en_GB" title="English" width="18" height="12" style="margin: 1ch 1ch 1ch 0;" :src="flag_en" />
                <span>{{$t('messages.language.en')}}</span>
              </router-link>
            </li>
          </ul>
        </details>
      </li>

    </ul>

  </nav>

  <iframe v-if="drf_token" :src="drf_token" hidden></iframe>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-facing-decorator';

import config from '@/config';
import { Info } from '@/types/TInfo';
import { get_admin_url } from '@/utils';

import { useRootStore, useAuthStore, useDataStore } from '@/stores';

import flag_en_src from '@/assets/img/flags/en_GB.png';
import flag_it_src from '@/assets/img/flags/it_IT.png';
import g3w_logo_src from '@/assets/img/logo_g3wsuite-bw.png';


@Component
export default class Navbar extends Vue {

  public g3w_logo: string = g3w_logo_src;
  public flag_it: string  =  flag_it_src;
  public flag_en: string  =  flag_en_src;

  public secondaryMenuVisible: boolean | null = true;

  get sections(): string[] {
    return useRootStore().portalSections;
  }

  get showAdmin(): boolean {
    return useRootStore().showAdminButton;
  }

  get info(): Info {
    return useDataStore().info;
  }

  get languages() {
    return config.languages;
  }

  get whoIs() {
    return useAuthStore().user;
  }

  get isLoggedIn() {
    return useAuthStore().isLoggedIn;
  }

  get hasNavBarTop(): boolean {
    return false !== (window as any).PORTAL_NAVBAR_TOP;
  }

  get hasMenuButton(): boolean {
    return this.hasNavBarTop || false !== (window as any).PORTAL_MENU_BUTTON;
  }

  get drf_token(): string {
    const drf_token = useAuthStore().user ? useAuthStore().user.drf_token : '';
    return (drf_token && 'logout' !== this.$route.name) ? get_admin_url(`/${this.$i18n.locale}/portal/api/whoami/?__drftk=${drf_token}`) : '';
  }

  public logout() {
    return useAuthStore().maybe_redirect({ name: 'logout' });
  }

  public mounted() {
    useAuthStore().fetchWhoAmI();
  }

  public toggleSecondaryMenu() {
    this.secondaryMenuVisible = this.secondaryMenuVisible ? null : true;
  }

  public switchLang(e: Event) {
    if ((window as any).PORTAL_LANG_BUTTON) {
      e.preventDefault();
      this.$router.push({
        name: 'home',
        params: { lang: ('it' === this.$i18n.locale ? 'en' : 'it') }
      });
    }
  }

  // @Watch('$route.params', {
  //   immediate: true,
  // })
  // public onRouteParamsChange() {
  //   this.secondaryMenuVisible = true;
  // }

}
</script>

<style lang="css" scoped>
  body > nav.top-menu {
    /* justify-content: end; */
    /* background-color: var(--contrast-focus); */
    --nav-element-spacing-vertical: var(--nav-element-spacing-horizontal);
  }

  /**
   * body > nav.main-menu li {
   *   padding: calc( var(--nav-element-spacing-vertical) / 2) var(--nav-element-spacing-horizontal);
   * }
   */

  body > nav {
    border-bottom: var(--nav-border-color, rgba(115, 130, 140, 0.2)) 1px solid;
    background-color: var(--background-color);
  }

  body > nav.main-menu > ul:last-of-type {
    border-top: var(--nav-border-color, rgba(115, 130, 140, 0.2)) 1px solid;
    justify-content: space-around;
  }

  body > nav.main-menu {
    position: sticky;
    top: 0;
    /* background: var(--background-color); */
    z-index: 10;
    flex-wrap: wrap;
  }

  body > nav.main-menu > ul:last-of-type {
    flex-basis: 100%;
  }

  nav .logo {
    max-height: 4rem;
    max-width: 10rem;
  }
  nav .h1 {
    display:block;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--h1-color);
  }
</style>
