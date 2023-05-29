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
import { Group } from '@/types/TGroup';
import { Info } from '@/types/TInfo';
import { MacroGroup } from '@/types/TMacroGroup';

import { useDataStore } from '@/stores';

@Component({
  components: { Projects },
})
export default class VGroup extends Vue {

  public items: Group[] = [];

  get info(): Info {
    return useDataStore().info;
  }

  @Watch('$route.params', {
    immediate: true,
    deep: true,
  })
  public async onRouteParamsChange({ id, group }: { id?: number, group?: number }) {
    // Home > Groups
    if (undefined === id) {
      this.items = useDataStore().superGroups;
    } else {
      this.items = useDataStore().projectsInGroup(group || id);
    }
  }

  /**
   * @FIXME
   */
   get title(): string {
    const sg: MacroGroup | Group = useDataStore().activeGroup;
    return sg ? sg.title : this.info.groups_title;
  }

  /**
   * @FIXME
   */
  get description(): string {
    const sg: MacroGroup | Group = useDataStore().activeGroup;
    return sg ? sg.description : this.info.groups_map_description;
  }

}
</script>
