<template>
  <figure v-if="$store.getters['settings/pictures'].length">
    <figure>
      <img :src="info.image" />
      <figcaption>
        <a v-if="info.author_url" :href="info.author_url">Photo by <u>{{info.author}}</u></a>
        <span v-else-if="info.author">Photo by {{info.author}}</span>
      </figcaption>
    </figure>
  </figure>
</template>

<script lang="ts">
import { IPictures } from '@/types/IPictures';
import { Component, Prop, Vue } from 'vue-property-decorator';
import { mapGetters } from 'vuex';

@Component({
  name: 'Carousel',
  components: {},
  computed: {
    ...mapGetters({
      pictures: 'settings/pictures',
    }),
  },
})
export default class Carousel extends Vue {
  public pictures!: IPictures[];

  private index: number = 0;

  get info() {
    return this.pictures[this.index % this.pictures.length] || {};
  }

  public mounted() {
    window.setInterval(() => {
      this.index++;
    }, 3000);
  }
}
</script>

<style lang="css" scoped>
  figure {
    margin-bottom: 0;
  }

  figure > img {
    width:100%;
    min-height: 400px;
    height: 80vh;
    aspect-ratio: 16/9;
    object-fit: cover;
  }

  figure > figcaption {
    z-index: 100;
    position: absolute;
    bottom: 0;
    right: 0;
  }
</style>