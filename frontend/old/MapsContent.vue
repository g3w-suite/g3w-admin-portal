<template>
  <div class="g3w-project-search position-relative p-3 p-md-0">
    <div class="h-100 text-white p-2 pr-3">
      <Search
        class="w-100 search_box d-none"
        style="margin-bottom: 5px;"
        :class="{'d-md-flex': ($route.name === 'mappe')}"
        v-model="search"
      ></Search>
      <tab-widget activeClass="gis_active"></tab-widget>
    </div>
  </div>
</template>

<script lang="ts">
  import G3wButton from '@/components/default/g3wButton.vue';
  import MainContent from '@/components/default/MainContent.vue';
  import Search from '@/components/Search.vue';
  import TabWidget from '@/views/Projects.vue';
  import {Component, Vue} from 'vue-property-decorator';


  @Component({
    components: {G3wButton, MainContent, TabWidget, Search},
  })

  export default class MapsContent extends Vue {
    get search() {
      return this.$store.getters['group/search'];
    }

    set search(val: string) {
      this.$store.dispatch('group/search', {s: val});
    }

  }
</script>

<style lang="scss" scoped>

  @import "../../styles/mixin.scss";

  ::v-deep #TabNav {
    .tab-button {
      height: 50px;
      color: black;
      display: flex;
      justify-content: center;
      align-items: center;
      border-width: 1px;
      border-style: solid;
    }
  }
  ::v-deep .gis_active {
    color: white !important;
    border-width: 0 !important;
  }

</style>
