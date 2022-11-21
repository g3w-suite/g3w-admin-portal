<template>
  <fragment>
    <span class="subtitle h5 show-on-mobile">{{settings.sub_title}}</span>
    <h1 class="title show-on-mobile">{{settings.title}}</h1>
    <Projects />
    <p v-html="settings.home_description"></p>
  </fragment>
</template>

<script lang="ts">
import { Info } from '@/types/TInfo';
import Projects from '@/views/Projects.vue';
import { Component, Vue } from 'vue-property-decorator';
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
