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
import Projects from '@/components/Projects.vue';
import { MacroGroup } from '@/types/TMacroGroup';
import Group from '@/views/Group.vue';
import { Component, Vue, Watch } from 'vue-property-decorator';

@Component({
  components: { Group, Projects },
})
export default class VMacroGroup extends Vue {

  public items: MacroGroup[] = [];

  @Watch('$route.params', {
    immediate: true,
  })
  public async onRouteParamsChange({ id, group }) {
    // Home > MacroGroups
    if (group || !id) {
      this.items = Object.values(this.$store.getters['group/macroGroups']);
    }
    // Home > MacroGroup > ID
    // Home > MacroGroup > ID > SubGroup
    else {
      const macroGroups = this.$store.getters['group/macroGroups'];
      await (macroGroups[id] as MacroGroup).fetchGroups();
      this.items = this.$store.getters['group/groupsInMacroGroup'](id);
      this.$store.dispatch('group/setActiveGroup', { sg: macroGroups[id] });
    }
  }

  /**
   * @FIXME
   */
   get title(): string {
    const sg: MacroGroup | Group = this.$store.getters['group/activeGroup'];
    return sg ? sg.title : this.settings.groups_title;
  }

  /**
   * @FIXME
   */
  get description(): string {
    const sg: MacroGroup | Group = this.$store.getters['group/activeGroup'];
    return sg ? sg.description : this.settings.groups_map_description;
  }

}
</script>

<style lang="scss" scoped>
</style>
