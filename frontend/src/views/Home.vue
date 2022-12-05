<template>
  <fragment>
    <span class="subtitle h5 show-on-mobile">{{settings.sub_title}}</span>
    <h1 class="title show-on-mobile">{{settings.title}}</h1>
    <hgroup>
      <h2>{{ settings.groups_title }}</h2>
      <p v-html="settings.groups_map_description"></p>
    </hgroup>
    <Projects
      :items="items"
      class="grid"
    />
    <section id="home-show-more-button">
      <a href="#" role="button" class="contrast outline">
        <router-link to="/group">{{$t('messages.home.show_all_button')}}</router-link>
      </a>
    </section>

  </fragment>
</template>

<script lang="ts">
import Projects from '@/components/Projects.vue';
import { Info } from '@/types/TInfo';
import { Component, Vue } from 'vue-property-decorator';
import { mapGetters } from 'vuex';
import {SuperGroup} from "@/types/TSuperGroup";

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
  // get all super group (macro group and group not in macro group)
  public items: SuperGroup[] = this.$store.getters['group/superGroups'];
  // used to show all items if more than 6
  public showMoreButton: Boolean = false;

  public created(){
    // in case of length more than 6, show only 6 elements
    if (this.items.length > 6) {
      this.items = this.items.slice(0, 6);
      this.showMoreButton = true;
    }
  }
}
</script>

<style lang="scss" scoped>
  #home-show-more-button {
    display: flex;
    justify-content: center;
    margin-top: 10px
  }
</style>
