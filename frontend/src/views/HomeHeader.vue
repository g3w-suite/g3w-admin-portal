<template>
  <Carousel />
  
  <div
    v-if="info.home_description"
    class="container"
    data-theme="dark"
    v-html="info.home_description"
  ></div>
  <!-- <form v-else class="container" @keyup.enter="onSearchSubmit">
    <input
      type="search"
      id="search"
      name="search"
      v-model="search"
      :placeholder="$t('messages.menu.search_placeholder')"
      :aria-label="$t('messages.menu.search_placeholder')"
    />
  </form> -->
</template>

<script lang="ts">
import { Component, Vue } from 'vue-facing-decorator';

import Carousel from '@/components/Carousel.vue';
import { Info } from '@/types/TInfo';

import { useGroupStore, useInfoStore } from '@/stores';

@Component({
  components: { Carousel },
})
export default class HomeHeader extends Vue {

  get info(): Info {
    return useInfoStore().info;
  }

  // @Prop public search!: string;

  // get search() {
  //   return useGroupStore().search;
  // }

  // set search(val: string) {
  //   useGroupStore().setSearchFilter(val);
  // }

  // public onSearchSubmit(e: Event) {
  //   this.$router.push( { path: '/search', query: { key: 'q', value: this.search }});
  //   console.log(e);
  // }

}
</script>

<style lang="css" scoped>
  body > header {
    padding: 0;
  }
  body > header {
    display: grid;
    grid-template-areas: "box";
  }

  header > *,
  header::before {
    grid-area: box;
  }

  header > .container {
    place-self: center;
  }

  /**
   * input[type="search"] {
   *   background-color: #fff;
   * }
   */

  header > div.container {
    background-color: rgb(0,0,0,.75);
    padding: 1em;
    border-radius: 1.5px;
    width: fit-content;
    text-align: center;
  }
</style>

<style lang="css">
  header > div.container h1 {
    --typography-spacing-vertical: 1rem;
  }
</style>