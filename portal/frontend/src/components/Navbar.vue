<template>
  <fragment>

    <!-- TOP MENU -->
    <nav id="top-menu" class="container-fluid top-menu" v-if="hasNavBarTop">

      <!-- ORGANIZATION NAME -->
      <ul>
        <li v-if="info.suite_org_url">
          <a :href="info.suite_org_url">
            <font-awesome-icon icon="arrow-up-right-from-square" size="sm" /> {{info.suite_org_name}}
          </a>
        </li>
      </ul>

      <ul>

        <!-- ADMIN LINK -->
        <li v-if="isLoggedIn">
          <router-link :to="{ name: 'admin' }" :title="$t('messages.tooltip.admin')" class="secondary">
            <font-awesome-icon icon="gear" size="lg" />
            <span class="hide-on-mobile"> {{$t('messages.menu.admin')}}</span>
          </router-link>
        </li>

        <!-- LOGOUT LINK -->
        <li v-if="isLoggedIn">
          <a href="#" @click="logout" :title="$t('messages.tooltip.logout')" class="secondary">
            <font-awesome-icon icon="sign-out-alt" size="lg" />
            <span class="hide-on-mobile"> {{$t('messages.menu.logout')}}</span>
          </a>
        </li>

        <!-- LOGIN LINK -->
        <li v-else>
          <router-link :to="{ name: 'login' }" :title="$t('messages.tooltip.login')" class="secondary">
            <font-awesome-icon icon="user" size="lg" />
            <span class="hide-on-mobile"> {{$t('messages.menu.login')}}</span>
          </router-link>
        </li>

        <!-- LANGUAGE SELECTOR -->
        <li>
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
        <li>
          <router-link :to="{ name:'home' }" aria-label="Back home" class="secondary">
            <img :src="info.suite_logo || info.url_suite_logo || g3w_logo" :alt="info.title" class="logo" />
          </router-link>
        </li>

        <!-- TITLE -->
        <li class="hide-on-mobile">
          <span class="h1">{{info.title}}</span>
          <span>{{info.sub_title}}</span>
        </li>

      </ul>

      <ul>

        <!-- SEARCH LINK -->
        <li>
          <router-link :to="{ name: 'search' }" :title="$t('messages.menu.search_placeholder')" class="contrast outline">
            <font-awesome-icon icon="search" size="lg" />
            {{ $t('messages.menu.search') }}
          </router-link>
        </li>

        <!-- ADMIN LINK -->
        <li v-if="!hasNavBarTop && isLoggedIn">
          <router-link :to="{ name: 'admin' }" :title="$t('messages.tooltip.admin')" class="secondary">
            <font-awesome-icon icon="gear" size="lg" />
            <span class="hide-on-mobile"> {{$t('messages.menu.admin')}}</span>
          </router-link>
        </li>

        <!-- LOGOUT LINK -->
        <li v-if="!hasNavBarTop && isLoggedIn">
          <a href="#" @click="logout" :title="$t('messages.tooltip.logout')" class="secondary">
            <font-awesome-icon icon="sign-out-alt" size="lg" />
            <span class="hide-on-mobile"> {{$t('messages.menu.logout')}}</span>
          </a>
        </li>

        <!-- LOGIN LINK -->
        <li v-else-if="!hasNavBarTop">
          <router-link :to="{ name: 'login' }" :title="$t('messages.tooltip.login')" class="secondary">
            <font-awesome-icon icon="user" size="lg" />
            <span class="hide-on-mobile"> {{$t('messages.menu.login')}}</span>
          </router-link>
        </li>

        <!-- LANGUAGE SELECTOR -->
        <li v-if="!hasNavBarTop">
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

        <!-- MENU LINK -->
        <li v-if="hasNavBarTop">
          <button @click="toggleSecondaryMenu" :title="$t('messages.tooltip.menu')" class="contrast outline">
            <font-awesome-icon :icon="secondaryMenuVisible ? 'bars' : 'xmark'" size="lg" />
            {{ $t('messages.menu.toggle') }}
          </button>
        </li>
      </ul>

      <ul :hidden="secondaryMenuVisible">
        <li>
            <router-link :to="{ name: 'home' }" class="secondary" :title="$t('messages.tooltip.home')">
              {{ $t('messages.menu.home') }}
            </router-link>
        </li>
        <li>
          <router-link :to="{ name: 'group' }" class="secondary">
            {{ $t('messages.menu.group') }}
          </router-link>
        </li>
        <!-- <li>
          <router-link :to="{ name: 'organization' }" class="secondary">
            {{ $t('messages.menu.organization') }}
          </router-link>
        </li> -->
      </ul>

    </nav>

  </fragment>
</template>

<script lang="ts">
import config from '@/config';
import { Info } from '@/types/TInfo';
import { Component, Vue } from 'vue-property-decorator';
import { mapGetters } from 'vuex';

@Component({
  components: { },
  computed: {
    ...mapGetters({
      sections: 'settings/portalSections',
      showAdmin: 'settings/showAdminButton',
      info: 'info/info',
    }),
  },
})

export default class Navbar extends Vue {

  public sections!: string[];
  public showAdmin!: boolean;
  public info!: Info;

  public g3w_logo: string = require('@/assets/img/logo_g3wsuite-bw.png');
  public flag_it: string  = require('@/assets/img/flags/it_IT.png');
  public flag_en: string  = require('@/assets/img/flags/en_GB.png');

  public secondaryMenuVisible: boolean | null = true;

  get languages() {
    return config.languages;
  }

  get whoIs() {
    return this.$store.getters['me/me'];
  }

  get isLoggedIn() {
    return this.$store.getters['me/isLoggedIn'];
  }

  get hasNavBarTop(): boolean {
    return false !== (window as any).PORTAL_NAVBAR_TOP;
  }

  public logout() {
    this.$store.dispatch('me/logout', { locale: this.$i18n.locale });
  }

  public mounted() {
    this.$store.dispatch('me/fetchWhoAmI', { locale: this.$i18n.locale });
  }

  public toggleSecondaryMenu() {
    this.secondaryMenuVisible = this.secondaryMenuVisible ? null : true;
  }
}
</script>

<style lang="scss" scoped>
  body > nav.top-menu {
    // justify-content: end;
    // background-color: var(--contrast-focus);
    --nav-element-spacing-vertical: var(--nav-element-spacing-horizontal);
  }

  // body > nav.main-menu li {
  //   padding: calc( var(--nav-element-spacing-vertical) / 2) var(--nav-element-spacing-horizontal);
  // }

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
    // background: var(--background-color);
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
