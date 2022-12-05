<template>
  <fragment>
    <Group v-if="$route.params.group"></Group>
    <Projects v-else :boxes="boxes" />
  </fragment>
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

  public boxes: MacroGroup[] = [];

  @Watch('$route.params', {
    immediate: true,
  })
  public async onRouteParamsChange({ id, group }) {
    // Home > MacroGroups
    if (group || !id) {
      this.boxes = Object.values(this.$store.getters['group/macroGroups']);
    }
    // Home > MacroGroup > ID
    // Home > MacroGroup > ID > SubGroup
    else {
      const macroGroups = this.$store.getters['group/macroGroups'];
      await (macroGroups[id] as MacroGroup).fetchGroups();
      this.boxes = this.$store.getters['group/groupsInMacroGroup'](id);
      this.$store.dispatch('group/setActiveGroup', { sg: macroGroups[id] });
    }
  }

}
</script>

<style lang="scss" scoped>
</style>
