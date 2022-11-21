<template>
  <MainContent>
    <template slot="tl-container">
      <div class="h-100 gradient text-white p-3">
        <home class="h-100 w-100 d-flex flex-column p-3" id=Home></home>
      </div>
    </template>
  </MainContent>
</template>

<script lang="ts">
import MainContent from '@/components/default/MainContent.vue';
  import Home from '@/views/Home.vue';
import {Component, Prop, Vue} from 'vue-property-decorator';
  // import {mapGetters} from 'vuex';
  // import {IPictures} from '@/types/IPictures';

  @Component({
    components: {MainContent, Home},
  })
  export default class HomeContent extends Home {
  }
</script>

<style lang="scss">

  @import "../../styles/_variables";

  .tl_content {
    border-top-left-radius: $gis_rounded_radius;
  }

  #Home {
    .title {
      font-family: 'Abril Fatface', cursive;
    }

    .subtitle {
      font-family: 'Lato', sans-serif;
    }
  }
</style>
