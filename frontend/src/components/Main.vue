<template>
  <fragment>

    <Header />

    <!-- <router-view name="header" /> -->

    <header v-if="$route.name === 'home'">
      <Carousel />
      
      <div v-if="info.home_description" class="container" data-theme="dark" v-html="info.home_description"></div>
      <form v-else class="container" @keyup.enter="onSearchSubmit">
        <input
          type="search"
          id="search"
          name="search"
          v-model="search"
          :placeholder="$t('messages.menu.search_placeholder')"
          :aria-label="$t('messages.menu.search_placeholder')"
        />
      </form>
    </header>

    <main class="container">
      <router-view />
    </main>

    <Footer />

  </fragment>
</template>

<script lang="ts">
  import { Info } from '@/types/TInfo';
  import Carousel from '@/components/Carousel.vue';
  import Footer from '@/components/Footer.vue';
  import Header from '@/components/Header.vue';
  import { Component, Vue } from 'vue-property-decorator';
  import { mapGetters } from 'vuex';

  @Component({
    components: { Header, Footer, Carousel },
    computed: {
      ...mapGetters({
        info: 'info/info',
        }),
    }
  })

  export default class Main extends Vue {
    public info!: Info;

    public search!: string;

    // get search() {
    //   return this.$store.getters['group/search'];
    // }

    // set search(val: string) {
    //   this.$store.dispatch('group/search', { s: val });
    // }

    onSearchSubmit(e:Event) {
      this.$router.push( { path: '/search', query: { key: 'q', value: this.search }});
      console.log(e);
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

  header > div.container {
    background-color: rgb(0,0,0,.75);
    padding: 1em;
    border-radius: 1.5px;
    width: fit-content;
    text-align: center;
  }
</style>

<style lang="scss">
  header > div.container h1 {
    --typography-spacing-vertical: 1rem;
  }
</style>