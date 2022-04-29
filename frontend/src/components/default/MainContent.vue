<template>
  <div class="position-relative">
    <div class="d-none d-md-block bg_image mr-4  position-absolute">
      <slot name="background-img">
        <transition-group name="fade">
          <div class="position-absolute w-100 sfondo" v-if="(index % pictures.length) == idx" v-for="(i,idx) in pictures" :key="i.id">
            <img alt="bg"  class="w-100" :src="i.image"/>
            <span class="photo_info pr-4 pb-3" :style="{color : i.main_color||'black'}">Photo by
                                <a v-if="i.author_url" :style="{color : i.main_color||'black'}" :href="i.author_url">
                                    <u>{{i.author}}</u>
                                </a>
                                <template v-else>{{i.author}}</template>
                            </span>
          </div>
        </transition-group>
      </slot>
    </div>
    <div class="content w-100 d-md-flex flex-wrap pr-lg-2 d-block">
      <div class="content_left p-2">
        <slot name="tl-container"></slot>
      </div>
      <div class="content_right d-none d-lg-block p-2">
        <slot name="tr-container"></slot>
      </div>
      <div class="content_left d-none d-lg-block"></div>
      <div class="content_right d-none d-lg-block p-2">
        <slot name="br-container"></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import {mapGetters} from 'vuex';

  @Component({
    components: {},
    computed: {
      ...mapGetters({
        pictures: 'settings/pictures',
      }),
    },
  })

  export default class AboutContent extends Vue {
    private index: number = 0;
    public mounted() {
      window.setInterval(() => {
        this.index++;
      }, 30000);
    }
  }
</script>

<style lang="scss" scoped>
  @import "../../styles/_variables";
  .photo_info {
    z-index: 100;
    position: absolute;
    bottom: 0;
    right: 0;
  }

  .bg_image {
    width: 85%;
    right: 0;
  }

  .content {
    position: relative;
    @include media-breakpoint-down(md) {
      width: (100 - $menu_width);
      max-height: 80vh;
    }
    @include media-breakpoint-down(lg) {
      max-height: 80vh;
    }
    @include media-breakpoint-down(sm) {
      width: 100%;
    }
    .content_left {
      width: 65%;
      @include media-breakpoint-down(md) {
        width: 100%;
      }
    }
    .content_right {
      width: 35%;
    }
  }

  .fade-enter{
    opacity: 0;
  }

  .fade-enter-to{
    opacity: 1;
  }

  .fade-leave{
    opacity: 1;
  }
  .fade-leave-to{
    opacity: 0;
  }

  .sfondo {
    transition: opacity 1000ms;
  }

</style>
