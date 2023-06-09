<template>
  <section>
    <hgroup v-if="$route.params.id">
      <h2>{{ title }}</h2>
      <p v-html="description"></p>
    </hgroup>
    <Projects
      :items="items"
      :class="$route.params.id !== undefined ? '' : 'grid'"
    />
  </section>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-facing-decorator';

import Projects from '@/components/Projects.vue';
import { Info } from '@/types/TInfo';

import { useDataStore } from '@/stores';
import { SuperGroup } from '@/types/TSuperGroup';

@Component({
  components: { Projects },
})
export default class VGroup extends Vue {

  public items: SuperGroup[] = [];

  get info(): Info {
    return useDataStore().info;
  }

  @Watch('$route.params', {
    immediate: true,
    deep: true,
  })
  public async onRouteParamsChange({ id, group }: { id?: number, group?: number }) {
    this.items = undefined === id
      ? useDataStore().superGroups                   // Home > Groups
      : useDataStore().projectsInGroup(group || id);
  }

  /**
   * @FIXME
   */
   get title(): string {
    return useDataStore()?.activeGroup?.title ?? this.info.groups_title;
  }

  /**
   * @FIXME
   */
  get description(): string {
    return useDataStore()?.activeGroup?.description ?? this.info.groups_map_description;
  }

}
</script>
