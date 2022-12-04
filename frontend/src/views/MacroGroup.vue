<template>
  <fragment>
    <Group v-if="$route.params.group"></Group>
    <Projects v-else :boxes="boxes" />
  </fragment>
</template>

<script lang="ts">
import Group from '@/views/Group.vue';
import Projects from '@/components/Projects.vue';

import { Component, Vue } from 'vue-property-decorator';
import {MacroGroup} from "@/types/TMacroGroup";

@Component({
  components: {Group, Projects },
  data() {
    return {
      boxes: []
    }
  },
  watch: {
    '$route.params': {
      immediate: true,
      async handler(params){
        const {id, group} = params;
        const macroGroups = this.$store.getters['group/macroGroups'];
        if (!group && id) {
          await (macroGroups[id] as MacroGroup).fetchGroups();
          this.boxes = this.$store.getters['group/groupsInMacroGroup'](id);
          this.$store.dispatch('group/setActiveGroup', { sg: macroGroups[id] });
        } else this.boxes = Object.values(this.$store.getters['group/macroGroups']);
      }
    }
  }
})
export default class VMacroGroup extends Vue {
}
</script>

<style lang="scss" scoped>
</style>
