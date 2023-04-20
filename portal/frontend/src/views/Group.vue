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
import Projects from '@/components/Projects.vue';
import { Group } from '@/types/TGroup';
import { Info } from '@/types/TInfo';
import { MacroGroup } from '@/types/TMacroGroup';
import { Component, Vue, Watch } from 'vue-property-decorator';
import { mapGetters } from 'vuex';

@Component({
  components: { Projects },
  computed: {
    ...mapGetters({
      info: 'info/info',
    }),
  },
})
export default class VGroup extends Vue {

  public items: Group[] = [];

  public info!: Info;

  @Watch('$route.params', {
    immediate: true,
    deep: true,
  })
  public async onRouteParamsChange({ id, group }: { id?: number, group?: number }) {
    // Home > Groups
    if (undefined === id) {
      this.items = this.$store.getters['group/superGroups'];
    } else {
      this.items = this.$store.getters['group/projectsInGroup'](group || id);
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

<style lang="css" scoped>
</style>
