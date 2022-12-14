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
import { Info } from '@/types/TInfo';
import { MacroGroup } from '@/types/TMacroGroup';
import Group from '@/views/Group.vue';
import { Component, Vue, Watch } from 'vue-property-decorator';
import { mapGetters } from 'vuex';

@Component({
  components: { Group, Projects },
  computed: {
    ...mapGetters({
      info: 'info/info',
    }),
  },
})
export default class VMacroGroup extends Vue {

  public items: MacroGroup[] = [];

  public info!: Info;

  @Watch('$route.params', {
    immediate: true,
  })
  public async onRouteParamsChange({ id }) {
    // Home > MacroGroups
    if (!id) {
      this.items = Object.values(this.$store.getters['group/macroGroups']);
    }
    // Home > MacroGroups > MacroGroup
    else {
      this.items = this.$store.getters['group/groupsInMacroGroup'](id);
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
