<template>
  <section>
    <hgroup v-if="($route.params.id && !$route.params.group)">
      <h2>{{ title }}</h2>
      <p v-html="description"></p>
    </hgroup>
    <Group v-if="$route.params.group" />
    <Projects v-else :items="items" class="grid" />
  </section>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-facing-decorator';

import Projects from '@/components/Projects.vue';
import { Info } from '@/types/TInfo';
import { MacroGroup } from '@/types/TMacroGroup';
import Group from '@/views/Group.vue';

import { useDataStore } from '@/stores';

@Component({
  components: { Group, Projects },
})
export default class VMacroGroup extends Vue {

  public items: MacroGroup[] = [];

  get info(): Info {
    return useDataStore().info;
  }

  @Watch('$route.params', {
    immediate: true,
  })
  public async onRouteParamsChange({ id }: { id?: number } ) {
     this.items = id
      ? useDataStore().groupsInMacroGroup(id)
      : Object.values(useDataStore().macroGroups); // Home > MacroGroups
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
