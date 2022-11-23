<template>
  <fragment>

    <!-- TOP MENU -->
    <nav id="top-menu" class="container-fluid">

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
          <router-link :to="{ name: 'admin' }" class="secondary">
            <font-awesome-icon icon="gear" size="lg" />
            <span class="hide-on-mobile"> {{$t('messages.menu.admin')}}</span>
          </router-link>
        </li>

        <!-- LOGOUT LINK -->
        <li v-if="isLoggedIn">
          <a href="#" @click="logout" class="secondary">
            <font-awesome-icon icon="sign-out-alt" size="lg" />
            <span class="hide-on-mobile"> {{$t('messages.menu.logout')}}</span>
          </a>
        </li>

        <!-- LOGIN LINK -->
        <li v-else>
          <router-link :to="{ name: 'login' }" class="secondary">
            <font-awesome-icon icon="user" size="lg" />
            <span class="hide-on-mobile"> {{$t('messages.menu.login')}}</span>
          </router-link>
        </li>

        <!-- LANGUAGE SELECTOR -->
        <li>
          <details role="list" dir="ltr">
            <summary aria-haspopup="listbox" role="link" class="secondary">
              <img alt="Choose a language" :title="$t('messages.language.' + $i18n.locale)" width="18" height="12" style="margin: 1ch 1ch 1ch 0;" :src="$i18n.locale === 'it' ? flag_it : flag_en" />
              <span class="hide-on-mobile">{{$t('messages.language.' + $i18n.locale)}}</span>
            </summary>
            <ul role="listbox">
              <li>
                <router-link :to="{ name: 'home', params: { lang: 'it' } }" class="secondary">
                  <img alt="it_IT" title="Italiano" width="18" height="12" style="margin: 1ch 1ch 1ch 0;" :src="flag_it" />
                  <span>{{$t('messages.language.it')}}</span>
                </router-link>
              </li>
              <li>
                <router-link :to="{ name: 'home', params: { lang: 'en' } }" class="secondary">
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
    <nav id="main-menu" class="container-fluid">

      <ul>

        <!-- LOGO -->
        <li>
          <router-link :to="{ name:'home' }" aria-label="Back home" class="secondary">
            <img :src="info.suite_logo || info.url_suite_logo || g3w_logo" :alt="info.title" class="logo" />
          </router-link>
        </li>

        <!-- TITLE -->
        <li class="hide-on-mobile">
          <span style="display:block; font-size: 1.5rem; font-weight: 700; color: var(--h1-color);">{{info.title}}</span>
          <span>{{info.sub_title}}</span>
        </li>

      </ul>

      <ul>
        <li>
          <router-link :to="{ name: 'search' }" class="contrast outline">
            <font-awesome-icon icon="search" size="lg" />
            Catalogo
          </router-link>
        </li>
        <li>
          <button @click="toggleSecondaryMenu" class="contrast outline">
            <font-awesome-icon :icon="secondaryMenuVisible ? 'bars' : 'xmark'" size="lg" />
            MENU
          </button>
        </li>
      </ul>

      <ul :hidden="secondaryMenuVisible">
        <li>
            <router-link :to="{ name: 'home' }" aria-label="Back home" class="secondary">
              {{ $t('messages.menu.home') }}
            </router-link>
        </li>
        <li>
          <router-link :to="{ name: 'maps' }" class="secondary">
            {{ $t('messages.menu.catalog') }}
          </router-link>
        </li>
        <li>
          <router-link :to="{ name: 'search' }" class="secondary">
            {{ $t('messages.menu.search') }}
          </router-link>
        </li>
      </ul>

    </nav>

  </fragment>
</template>

<script lang="ts">
  import { Info } from '@/types/TInfo';
  import { Component, Prop, Vue } from 'vue-property-decorator';
  import { mapGetters } from 'vuex';
  // import { APP_LANGUAGES } from '@/main';

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

    public g3w_logo: string = 'data:image/png;base64,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';
    public flag_it: string  = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAMCAYAAABvEu28AAAAlElEQVQoU2NkeMnwn+E7AwPDZyD+BsRQ8N/sP4KDzGJkxCrOyPAAaNAXqCEgGmaQI/EGgVQyMlyGuuguqkX/I4g36DXYoJNAg74CWS/JM+gtUNurUYNQAw8t+mkQRnuAsQZKiKCYQwLERv9NeKythxoESoxICfJN/BvsKVtEBC4OUgHCkOhfhN2ga2HXsBukpYXVIAB75l/0TlWQpQAAAABJRU5ErkJggg==';
    public flag_en: string  = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAMCAYAAABvEu28AAAB8ElEQVQoU62SXUiTYRTHf28QNCjLFpUEuwlEhT6IhdIoChJvMqhEcSLUyowZCW7vhTTvpgwmElMkk00v5pbQK5R9UAoaYRgDqS6UJHcxLIlcr1asCdHb0wMNaYNuPPDA/zznnP/5VIzWVoOODlIpKC7uI5FI8lcikQZq3YelGu18jd3en7FZLGbuXd/LgREfm1UVZTX8xsgbdEF3NxQV4XJN0dX1TAaEQhe5dNMm8UD7FA7HoMTNV0q5ZXoO+kcIBrn/ZA4FOg3VaaU5dZdtP3TyhoZ48fITNTV3aGk5jd1/QQZHVE0kGKffYaF0rI9dHg9UVlJfP0A4PPGHqN2ANQoKlCyn2dlVdpwqlERfHsyQf9ublWxpKS6saRRDCOk0YjiZ/teDD2VlUt03PZ3TnojH+azrgggEk+DJ6fb/z/fCRRdvA4k2qrX1wx4evsrxY3v4WlfHN1M++jUPO88ekf2tTMxTUrIdRkdZ9np5Vd5IQyhBZtjQZjQ12ejpqchyyrX+f5M1Lpp5NP4WJRZbMawHTSxUV7O4aQuBtUOMPJ6TVahqBWeCNyR+eDmA3/9U4qoqKz7fOZa1KAviIGOFNpSfmmbMi1Inj56nTYuTTH7PrMrpPEl5VByekLFaL729kxmb2bwVt/sE+3f/4l0gwG/CjeZfBzqg4wAAAABJRU5ErkJggg==';

    public secondaryMenuVisible: boolean | null = true;

    get languages() {
      return ['it', 'en']; // APP_LANGUAGES;
    }

    get whoIs() {
      return this.$store.getters['me/me'];
    }

    get isLoggedIn() {
      return this.$store.getters['me/isLoggedIn'];
    }

    public logout() {
      this.$store.dispatch('me/logout', { locale: this.$i18n.locale });
      this.$store.dispatch('group/reset');
      if (this.$route.name !== 'home') {
        this.$router.push({ name: 'home' });
      }
      this.$store.dispatch('menu/setVisibility', { v: false });
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
  body > nav:nth-of-type(1) {
    // justify-content: end;
    // background-color: var(--contrast-focus);
    --nav-element-spacing-vertical: var(--nav-element-spacing-horizontal);
  }

  // body > nav:nth-of-type(2) li {
  //   padding: calc( var(--nav-element-spacing-vertical) / 2) var(--nav-element-spacing-horizontal);
  // }

  body > nav {
    border-bottom: var(--nav-border-color, rgba(115, 130, 140, 0.2)) 1px solid;
    background-color: var(--background-color);
  }

  body > nav:nth-of-type(2) > ul:last-of-type {
    border-top: var(--nav-border-color, rgba(115, 130, 140, 0.2)) 1px solid;
    justify-content: space-around;
  }

  body > nav:nth-of-type(2) {
    position: sticky;
    top: 0;
    // background: var(--background-color);
    z-index: 10;
    flex-wrap: wrap;
  }

  body > nav:nth-of-type(2) > ul:last-of-type {
    flex-basis: 100%;
  }

  nav .logo {
    max-height: 4rem;
  }
</style>
