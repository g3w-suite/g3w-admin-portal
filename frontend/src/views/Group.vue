<template>
  <fragment>
    <Projects :boxes="boxes" />
  </fragment>
</template>

<script lang="ts">
import Projects from '@/components/Projects.vue';
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Group } from '@/types/TGroup';

@Component({
  components: { Projects },
  data() {
    return {
      boxes: []
    }
  },
  watch: {
    '$route.params': {
      immediate: true,
      async handler(params) {
        const {id} = params;
        const groups = this.$store.getters['group/groups'];
        if (id) {
          await (groups[id] as Group).fetchProjects();
          this.boxes = this.$store.getters['group/projectsInGroup'](id);
          this.$store.dispatch('group/setActiveGroup', { sg: groups[id] });
        } else this.boxes = Object.values(this.$store.getters['group/groupsWithNoMacroGroup']);
      }
    }
  }
})
export default class VGroup extends Vue {
}
</script>

<style lang="scss" scoped>
</style>
