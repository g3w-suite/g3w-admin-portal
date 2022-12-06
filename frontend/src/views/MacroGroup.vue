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
import { Info } from '@/types/TInfo';
import Group from '@/views/Group.vue';
import { Component, Vue, Watch } from 'vue-property-decorator';
import { mapGetters } from 'vuex';

@Component({
  components: { Group, Projects },
  computed: {
    ...mapGetters({
      info: 'info/info',
    }),
  }
})
export default class VMacroGroup extends Vue {

  public items: MacroGroup[] = [];

  public info!: Info;

  @Watch('$route.params', {
    immediate: true,
  })
  public async onRouteParamsChange({ id, group }) {
    // Home > MacroGroups
    if (group || !id) {
      this.items = Object.values(this.$store.getters['group/macroGroups']);
      this.$store.dispatch('group/setActiveGroup', { sg: null });
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
    return sg ? sg.title : this.info.groups_title;
  }

  /**
   * @FIXME
   */
  get description(): string {
    const sg: MacroGroup | Group = this.$store.getters['group/activeGroup'];
    return sg ? sg.description : this.info.groups_map_description;
  }

}
</script>

<style lang="scss" scoped>
</style>
