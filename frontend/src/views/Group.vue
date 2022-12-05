<template>
  <fragment>
    <Projects :boxes="boxes" />
  </fragment>
</template>

<script lang="ts">
import Projects from '@/components/Projects.vue';
import { Group } from '@/types/TGroup';
import { Component, Vue, Watch } from 'vue-property-decorator';

@Component({
  components: { Projects },
})
export default class VGroup extends Vue {

  public boxes: Group[] = [];

  @Watch('$route.params', {
    immediate: true,
    deep: true,
  })
  public async onRouteParamsChange({ id, group, lang }) {
    // Home > Groups
    if (undefined === id) {
      this.boxes = Object.values(this.$store.getters['group/groupsWithNoMacroGroup']);
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
      this.boxes = this.$store.getters['group/projectsInGroup'](key);
      this.$store.dispatch('group/setActiveGroup', { sg: activeGroup });
    }
  }

}
</script>

<style lang="scss" scoped>
</style>
