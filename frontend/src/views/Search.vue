<template>
  <input
    type="search"
    id="search"
    name="search"
    v-model="search"
    :placeholder="$t('messages.menu.search_placeholder')"
    :aria-label="$t('messages.menu.search_placeholder')"
  />
  <Projects :items="items_filter" />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-facing-decorator';

import Projects from '@/components/Projects.vue';

import { useGroupStore, useInfoStore } from '@/stores';

@Component({
  components: { Projects },
})
export default class Search extends Vue {

  get items_filter() {
    return useGroupStore().Search ? useGroupStore().filteredProjects : useGroupStore().projects;
  }

  get settings() {
    return useInfoStore().info;
  }

  get search() {
    return useGroupStore().Search;
  }

  set search(val: string) {
    useGroupStore().setSearchFilter(val);
  }
}
</script>

<style lang="css" scoped>
  input[type="search"] {
    margin-bottom: var(--block-spacing-vertical);
  }
</style>
