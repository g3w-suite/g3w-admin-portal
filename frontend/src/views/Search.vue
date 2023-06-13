<template>
  <input
    type="search"
    id="search"
    name="search"
    v-model="search"
    :placeholder="$t('menu.search_placeholder')"
    :aria-label="$t('menu.search_placeholder')"
  />
  <Projects :items="items_filter" />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-facing-decorator';

import Projects from '@/components/Projects.vue';

import { useDataStore } from '@/stores';

@Component({
  components: { Projects },
})
export default class Search extends Vue {

  get items_filter() {
    return useDataStore().search ? useDataStore().filteredProjects : useDataStore().projects;
  }

  get settings() {
    return useDataStore().info;
  }

  get search() {
    return useDataStore().search;
  }

  set search(val: string) {
    useDataStore().setSearchFilter(val);
  }
}
</script>

<style lang="css" scoped>
  input[type="search"] {
    margin-bottom: var(--block-spacing-vertical);
  }
</style>
