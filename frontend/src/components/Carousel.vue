<template>
  <figure v-if="pictures.length">
    <figure>
      <transition name="fade" appear>
        <img :src="picture_url" :key="index" />
      </transition>
      <figcaption>
        <a v-if="info.author_url" :href="info.author_url">Photo by <u>{{info.author}}</u></a>
        <span v-else-if="info.author">Photo by {{info.author}}</span>
      </figcaption>
    </figure>
  </figure>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-facing-decorator';

import { useDataStore } from '@/stores';
import { get_img_url } from '@/utils';

@Component({
  name: 'Carousel',
  components: {},
})
export default class Carousel extends Vue {

  public index: number = 0;

  public showing = false;

  get pictures() {
    return useDataStore().pictures;
  }

  get info() {
    return this.pictures[this.index % this.pictures.length] || {};
  }

  get picture_url(): string {
    return get_img_url(this.info.image);
  }

  public mounted() {
    window.setInterval(() => {
      this.index++;
    }, 5000);
  }

}
</script>

<style lang="css" scoped>
  figure {
    margin-bottom: 0;
    display: grid;
    grid-template: "carousel";
  }

  figure > img {
    width:100%;
    min-height: 400px;
    height: 80vh;
    aspect-ratio: 16/9;
    object-fit: cover;
    grid-row: 1;
    grid-column: 1;
    z-index: -1;
  }

  figure > figcaption {
    z-index: 100;
    position: absolute;
    bottom: 0;
    right: 0;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 1s !important;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>