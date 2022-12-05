<template>
  <fragment>
    <Projects :boxes="boxes" />
  </fragment>
</template>

<script lang="ts">
import Projects from '@/components/Projects.vue';
import store from '@/store';
import { Group } from '@/types/TGroup';
import { Component, Vue, Watch } from 'vue-property-decorator';

@Component({
  components: { Projects },
  data() {
    return {
      boxes: [],
    };
  },
  watch: {
    '$route.params': {
      immediate: true,
      async handler(params) {
        const {id, group, lang} = params;
        const groups = this.$store.getters['group/groups'];
        if (id) {
          if (typeof group !== 'undefined' && typeof groups[group] === 'undefined') {
            this.$store.dispatch('showLoader');
            await this.$store.dispatch('group/fetchGroupsByMacroGroupId', {
              locale: lang,
              id,
            });
            this.$store.dispatch('hideLoader');
          }
          const key = group || id;
          const  _group = groups[key];
          await (_group as Group).fetchProjects();
          this.boxes = this.$store.getters['group/projectsInGroup'](key);
          this.$store.dispatch('group/setActiveGroup', { sg: _group });
        } else { this.boxes = Object.values(this.$store.getters['group/groupsWithNoMacroGroup']); }
      },
    },
  },
})
export default class VGroup extends Vue {
}
</script>

<style lang="scss" scoped>
</style>
