<template>
  <fragment>

    <Navbar />

    <header id="header" v-if="$route.matched[$route.matched.length - 1].components.header">
      <router-view name="header" />
    </header>

    <Breadcrumb id="breadcrumb" v-if="!$store.getters.showLoader" />

    <main id="content" class="container">
      <progress v-if="$store.getters.showLoader"></progress>
      <router-view />
    </main>

    <Footer />
    <ScrollTopArrow />

  </fragment>
</template>

<script lang="ts">
import Breadcrumb from '@/components/Breadcrumb.vue';
import Footer from '@/components/Footer.vue';
import Navbar from '@/components/Navbar.vue';
import ScrollTopArrow from '@/components/ScrollTop.vue';
import { Component, Vue } from 'vue-property-decorator';

@Component({
  components: { Navbar, Footer, Breadcrumb, ScrollTopArrow },
})

export default class Main extends Vue {

}
</script>

<style lang="scss" scoped>
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