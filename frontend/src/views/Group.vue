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
import { Component, Vue, Watch } from 'vue-property-decorator';
import { mapGetters } from 'vuex';

@Component({
  components: { Projects },
  computed: {
    ...mapGetters({
      info: 'info/info',
    }),
  }
})
export default class VGroup extends Vue {

  public items: Group[] = [];
  
  public info!: Info;

  @Watch('$route.params', {
    immediate: true,
    deep: true,
  })
  public async onRouteParamsChange({ id, group, lang }) {
    // Home > Groups
    if (undefined === id) {
      this.items = Object.values(this.$store.getters['group/groupsWithNoMacroGroup']);
    }
    // Home > Group > ID
    else {
      const groups = this.$store.getters['group/groups'];
      if (undefined !== group && undefined === groups[group]) {
        this.$store.dispatch('showLoader');
        await this.$store.dispatch('group/fetchGroupsByMacroGroupId', { id, locale: lang });
        this.$store.dispatch('hideLoader');
      }
      const key = group || id;
      const activeGroup: Group = groups[key];
      await activeGroup.fetchProjects();
      this.items = this.$store.getters['group/projectsInGroup'](key);
      this.$store.dispatch('group/setActiveGroup', { sg: activeGroup });
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
