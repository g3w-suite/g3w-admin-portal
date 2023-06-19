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
import { SuperGroup } from '@/types/TSuperGroup';

@Component({
  components: { Group, Projects },
})
export default class VMacroGroup extends Vue {

  public items: SuperGroup[] = [];

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
