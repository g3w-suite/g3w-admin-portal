<template>
  <fragment>
    <Header />
    <!-- <router-view name="header"></router-view> -->
    <Carousel v-if="$route.name === 'home'" class="bg_image h-100"></Carousel>
    <main class="container">
      <router-view></router-view>
    </main>
    <Footer />
  </fragment>
</template>

<script lang="ts">
  import Carousel from '@/components/Carousel.vue';
  import Footer from '@/components/Footer.vue';
  import Header from '@/components/Header.vue';
  import { Component, Vue } from 'vue-property-decorator';

  @Component({
    components: { Header, Footer, Carousel },
  })

  export default class Main extends Vue {
    get search() {
      return this.$store.getters['group/search'];
    }

    set search(val: string) {
      this.$store.dispatch('group/search', { s: val });
    }

  }
</script>