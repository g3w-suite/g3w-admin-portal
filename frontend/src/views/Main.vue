<template>
  <div class="vh-100 d-flex flex-column" id="main" :class="[$store.getters['menu/isVisible'] ? 'overlay' : '']">
    <MobileCarousel v-if="$route.name === 'home'" class="d-md-none d-block w-100 position-absolute bg_image"></MobileCarousel>
    <div class="z-100 header d-flex py-2 pl-2 pr-2 pb-2 pr-md-0 vh-90">
      <router-view name="header"></router-view>
    </div>
    <div class="body px-0 pl-md-1 pr-md-0 flex-grow-1 align-items-stretch">
            <div class="info d-flex h-100">
                <router-view class="content"></router-view>
                <router-view class="d-none d-md-block menu" name="menu"></router-view>
            </div>
        </div>
    <div class="g3wsuitelogo-container p-2 pl-3 d-inline">
      <span class="pwrdby font-weight-bold">Powered By&nbsp;</span>
      <img class="g3wsuitelogo" src="/static/frontend/img/logo_g3wsuite.png" alt="g3wlogo">
    </div>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator';
import MobileCarousel from '@/components/MobileCarousel.vue';

@Component({components: {MobileCarousel},
})
export default class Main extends Vue {}
</script>

<style lang="scss">
  @import '../styles/_variables.scss';
  @import '../styles/mixin';
  #main.overlay{
    @include media-breakpoint-down(sm) {
      &:after {}
    }
  }
  .content {
    @include media-breakpoint-down(sm) {
      width: 100%;
    }
    width: (100 - $menu_width);
  }
  .menu {
    width: $menu_width;
  }
  .g3wsuitelogo-container {
    position: fixed;
    left: 0;
    bottom: 0;
    background-color: #202a2e;
    width: 100vw;
    height: 5vh;
    vertical-align: center;
    .pwrdby {
      font-size: 0.7rem;
      color: #ffffff;
    }
    .g3wsuitelogo {
      width: 100px;
      height: auto;
    }
  }
</style>
