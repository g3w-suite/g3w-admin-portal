<template>
  <fragment>
    <span class="subtitle h5 show-on-mobile">{{settings.sub_title}}</span>
    <h1 class="title show-on-mobile">{{settings.title}}</h1>
    <hgroup>
      <h2>{{ settings.groups_title }}</h2>
      <p v-html="settings.groups_map_description"></p>
    </hgroup>
    <Projects :items="$store.getters['group/superGroups']" class="grid" />
  </fragment>
</template>

<script lang="ts">
import Projects from '@/components/Projects.vue';
import { Info } from '@/types/TInfo';
import {Component, Vue} from 'vue-property-decorator';
import { mapGetters } from 'vuex';

// const logo = require('@/assets/img/logo_g3wsuite.png');

@Component({
  components: { Projects },
  computed: {
    ...mapGetters({
      settings: 'info/info',
    }),
  },

})
export default class Home extends Vue {
  public settings!: Info;
}
</script>

<style lang="scss" scoped>
</style>
