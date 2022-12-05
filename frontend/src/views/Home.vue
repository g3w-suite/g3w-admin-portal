<template>
  <fragment>
    <span class="subtitle h5 show-on-mobile">{{settings.sub_title}}</span>
    <h1 class="title show-on-mobile">{{settings.title}}</h1>
    
    <!-- TITLE AND DESSCRIPTION -->
    <hgroup>
      <h2>{{ settings.groups_title }}</h2>
      <p v-html="settings.groups_map_description"></p>
    </hgroup>
    
    <!-- FEATURED GROUPS -->
    <Projects
      :items="items"
      class="grid"
    />
    
    <!-- LOAD MORE BUTTON -->
    <div
      v-if="items.length === maxItemstoShow"
      style="text-align: center; margin: calc(var(--block-spacing-vertical)) auto;">
      <router-link
        role="button"
        :to="{name: 'group'}"
      >
        {{$t('messages.home.show_all_button')}}
      </router-link>
    </div>

  </fragment>
</template>

<script lang="ts">
import Projects from '@/components/Projects.vue';
import { Info } from '@/types/TInfo';
import { Component, Vue } from 'vue-property-decorator';
import { mapGetters } from 'vuex';
import { SuperGroup } from "@/types/TSuperGroup";

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

  public maxItemstoShow: number = 6;

  // get all super group (macro group and group not in macro group)
  public items: SuperGroup[] = this.$store.getters['group/superGroups'];

  public created() {
    // in case of length more than 6, show only 6 elements
    if (this.items.length > this.maxItemstoShow) {
      this.items = this.items.slice(0, this.maxItemstoShow);
    }
  }

}
</script>

<style lang="scss" scoped>
</style>
