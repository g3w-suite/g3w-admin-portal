<template>
  <div class="ButtonMenu">
    <div @click="toggleMenu" class=" innerButton rounded d-flex flex-column justify-content-around align-items-center">
      <span class="line w-100"></span>
      <span class="line w-100"></span>
      <span class="line w-100"></span>
    </div>
    <transition name="slide-fade">
      <div class="text-white mobileMenu d-flex flex-column" v-if="$store.getters['menu/isVisible']">
        <div class="d-flex mobile_menu_sub">
          <g3w-button :alwaysExpanded="true" @click="switchLang" class="left_rounded mobile_button pointer d-flex" icon="language" :class="width" size="lg">
            <div class="align-item-center m-auto d-flex justify-content-center align-items-center">
              <country-flag :country='flag' size='normal'/>
            </div>
          </g3w-button>
          <g3w-button @click="goToHome" :alwaysExpanded="true" class="mobile_button pointer" icon="home" :class="width" size="lg">
            <div class="h-100 w-100 text-white d-flex justify-content-center align-items-center position-relative">
              <font-awesome-icon icon="home" class="position-absolute" size="lg"></font-awesome-icon>
            </div>
          </g3w-button>
          <g3w-button :alwaysExpanded="true" :icon="Icon" :class="width" class="mobile_button pointer">
            <div @click="logout" class="h-100 w-100 text-white d-flex justify-content-center align-items-center position-relative" v-if="isLoggedIn">
              <font-awesome-icon :icon="Icon" class="position-absolute" size="lg"></font-awesome-icon>
            </div>
            <div @click="goToLogin" class="h-100 w-100 text-white d-flex justify-content-center align-items-center position-relative" v-else>
              <font-awesome-icon :icon="Icon" class="position-absolute" size="lg"></font-awesome-icon>
            </div>
          </g3w-button>
          <g3w-button :alwaysExpanded="true" v-if="showAdmin && isLoggedIn" class="mobile_button d-flex align-items-center justify-content-center" :class="width" :icon="Icon">
            <a href="/admin" rel="noopener noreferrer nofollow" class="position-absolute text-white">
              <font-awesome-icon icon="user-shield" size="lg"></font-awesome-icon>
            </a>
          </g3w-button>
        </div>
        <Menu :alwaysExpanded="true" @buttonClicked="$store.dispatch('menu/setVisibility',{v:false})" class="d-flex flex-grow-1" hoverClasses="gradient"></Menu>
      </div>
    </transition>
  </div>

</template>

<script lang="ts">
import G3wButton from '@/components/default/g3wButton.vue';
  import Menu from '@/components/default/Menu.vue';
  import Header from '@/components/Header.vue';
  import CountryFlag from 'vue-country-flag';
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {mapGetters} from 'vuex';

  @Component({
    components: {Menu, G3wButton, CountryFlag},
    computed: {
      ...mapGetters({
        showAdmin: 'settings/showAdminButton',
      }),
    },
  })
  export default class MobileMenu extends Header {
    // private showMenu: boolean = false;
    // private showAdmin!: any;

    get width() {
      if (this.showAdmin && this.isLoggedIn) {
        return 'w-25';
      }
      return 'w-33';
    }

    private toggleMenu() {
      this.$store.dispatch('menu/toggleVisibility');
    }

    get Icon() {
      if (this.isLoggedIn) {
        return 'sign-out-alt';
      } else {
        return 'user-lock';
      }
    }

    get flag() {
      switch (this.$i18n.locale) {
        case 'en':
          return 'it';
        case 'it':
          return 'gb';
      }
      this.$store.dispatch('menu/setVisibility', {v: false});
    }

    private goToHome() {
      if (this.$route.name !== 'home') {
        this.$router.push({name: 'home'});
      }
      this.$store.dispatch('menu/setVisibility', {v: false});
    }

    private goToLogin() {
      if (this.$route.name !== 'login') {
        this.$router.push({name: 'login'});
      }
      this.$store.dispatch('menu/setVisibility', {v: false});
    }

    private switchLang() {
      if (this.$root.$i18n.locale === 'it') {
        this.$root.$i18n.locale = 'en';
      } else if (this.$root.$i18n.locale === 'en') {
        this.$root.$i18n.locale = 'it';
      }
      this.$store.dispatch('menu/setVisibility', {v: false});
      this.$router.replace({name: this.$route.name, params: {lang: this.$root.$i18n.locale}});
      window.location.reload();
    }

  }
</script>

<style lang="scss" scoped>

  @import "../../styles/_variables.scss";
  @import "../../styles/mixin.scss";

  ::v-deep .expanded-class {
    width: 100% !important;
  }

  .ButtonMenu {
    height: 50px;
    width: 70px;
    border: 0;
    z-index: 99;

    .innerButton {
      cursor: pointer;
      height: 100%;

      .line {
        height: 5px;
        background-color: $white;
        /*margin: 10px;*/
        border-radius: 2px;
      }
    }
  }

  .slide-fade-enter-active {
    transition: all .5s ease;
  }

  .slide-fade-leave-active {
    transition: all .5s ease;
  }

  .slide-fade-enter, .slide-fade-leave-to
    /* .slide-fade-leave-active below version 2.1.8 */
  {
    transform: translateX(100%);
    opacity: 0;
  }

  .mobileMenu {
    opacity: 0.9;
    /*background-color: $palette_viola_fourth;*/
    position: fixed;
    width: 50vw;
    top: 100px;
    right: 0;
    bottom: 0;
    z-index: 99;

    .mobile_menu_sub{
      height: 64px;
    }

    .left_rounded {
      border-top-left-radius: $gis_rounded_radius;
      border-bottom-left-radius: $gis_rounded_radius;
    }
  }

  .img_container {
    height: $header_height;

  }

</style>
