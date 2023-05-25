<template>
  <Navbar />

  <header id="header" v-if="has_header">
    <router-view name="header" />
  </header>

  <Breadcrumb id="breadcrumb" v-if="!show_loader" />

  <main id="content" class="container">
    <progress v-if="show_loader"></progress>
    <router-view />
  </main>

  <Footer />
  <ScrollTopArrow />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-facing-decorator';

import Breadcrumb from '@/components/Breadcrumb.vue';
import Footer from '@/components/Footer.vue';
import Navbar from '@/components/Navbar.vue';
import ScrollTopArrow from '@/components/ScrollTop.vue';
import { useRootStore } from '@/stores';

@Component({
  components: { Navbar, Footer, Breadcrumb, ScrollTopArrow },
})

export default class Main extends Vue {

  get has_header(): boolean {
    return !!this.$route.matched[this.$route.matched.length - 1].components.header;
  }

  get show_loader(): boolean {
    return useRootStore().isLoading;
  }

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
</style>