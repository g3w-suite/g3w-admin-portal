<template>
  <span class="subtitle h5 show-on-mobile">{{settings.sub_title}}</span>
  <h1 class="title show-on-mobile">{{settings.title}}</h1>
  
  <!-- TITLE AND DESCRIPTION -->
  <hgroup>
    <h2>{{ settings.groups_title }}</h2>
    <p v-html="settings.groups_map_description"></p>
  </hgroup>
  
  <!-- FEATURED GROUPS -->
  <Projects
    :items="featuredGroups"
    class="grid"
  />
  
  <!-- LOAD MORE BUTTON -->
  <div
    v-if="items.length === maxItemstoShow"
    id="load-more"
    style="text-align: center; margin: calc(var(--block-spacing-vertical)) auto;">
    <router-link
      role="button"
      :to="{name: 'group'}"
    >
      {{$t('messages.home.show_all_button')}}
    </router-link>
  </div>
</template>

<script lang="ts">
import Projects from '@/components/Projects.vue';
import { Info } from '@/types/TInfo';
import { SuperGroup } from '@/types/TSuperGroup';
import { Component, Vue } from 'vue-facing-decorator';
import config from '@/config';

@Component({
  components: { Projects },
})
export default class Home extends Vue {

  public maxItemstoShow: number = parseInt(config.max_home_articles, 10);

  // get all super group (macro group and group not in macro group)
  public items: SuperGroup[] = [];

  get settings(): Info {
    return this.$store.getters['info/info'];
  }

  get featuredGroups(): SuperGroup[] {
    const items = (-1 === this.maxItemstoShow) ? [] : this.$store.getters['group/superGroups'];
    // hide elements from home page that execeds the given length
    this.items = (items.length > this.maxItemstoShow)
      ? items.slice(0, this.maxItemstoShow)
      : items;
    this.$store.dispatch('group/setActiveGroup', { sg: null });
    return items;
  }

}
</script>
