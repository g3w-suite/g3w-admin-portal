<template>
  <fragment>

    <Header />

    <!-- <router-view name="header" /> -->

    <header v-if="$route.name === 'home'">
      <Carousel />
      <div class="container">
        <input
          type="search"
          id="search"
          name="search"
          v-model="search"
          :placeholder="$t('messages.menu.search_placeholder')"
          :aria-label="$t('messages.menu.search_placeholder')"
          @input="$emit('input', $event.target.value)"
        />
      </div>
    </header>

    <main class="container">
      <router-view />
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

  input[type="search"] {
    background-color: #fff;
  }
</style>