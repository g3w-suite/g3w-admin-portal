<template>
  <span class="subtitle h5 show-on-mobile">{{settings.sub_title}}</span>
  <h1 class="title show-on-mobile">{{settings.title}}</h1>
  
  <!-- TITLE AND DESCRIPTION -->
  <hgroup>
    <h2>{{ settings.groups_title }}</h2>
    <p v-html="settings.groups_map_description"></p>
  </hgroup>
  
  <!-- FEATURED GROUPS -->
  <Projects :items="items" class="grid" />
  
  <!-- LOAD MORE BUTTON -->
  <div
    v-if="show_more"
    id="load-more"
    style="text-align: center; margin: calc(var(--block-spacing-vertical)) auto;">
    <router-link role="button" :to="{name: 'group'}">
      {{$t('home.show_all_button')}}
    </router-link>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-facing-decorator';

import Projects from '@/components/Projects.vue';
import config from '@/config';

import { useDataStore } from '@/stores';

const max = parseInt(config.max_home_articles, 10);

@Component({
  components: { Projects },
})
export default class Home extends Vue {

  public maxItemstoShow: number = isNaN(max) || -1 === max ? +Infinity : max;

  get settings() {
    return useDataStore().info;
  }

  get superGroups() {
    return useDataStore().superGroups;
  }

  get show_more() {
    return ![0, +Infinity].includes(this.maxItemstoShow) && this.superGroups.length > this.maxItemstoShow;  
  }

  // get all super group (macro group and group not in macro group)
  get items() {
    useDataStore().unsetActiveGroup();
    // hide elements from home page that execeds the given length
    const items = this.superGroups;
    return items.slice(0, Math.min(items.length, this.maxItemstoShow));
  }

}
</script>
