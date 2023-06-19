<template>
  <section>
    <hgroup v-if="$route.params.id">
      <h2>{{ title }}</h2>
      <p v-html="description"></p>
    </hgroup>
    <Projects
      :items="items"
      :class="archive_class"
    />
  </section>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-facing-decorator';

import Projects from '@/components/Projects.vue';
import { Info } from '@/types/TInfo';

import { useDataStore } from '@/stores';
import { SuperGroup } from '@/types/TSuperGroup';

@Component({
  components: { Projects },
})
export default class VGroup extends Vue {

  public items: SuperGroup[] = [];

  public archive_class = ''

  get info(): Info {
    return useDataStore().info;
  }

  @Watch('$route.params', {
    immediate: true,
    deep: true,
  })
  public async onRouteParamsChange({ id, group }: { id?: string, group?: string }) {
    const is_archive = (undefined === id || '' ===  id); // TODO: make it generic ( eg. has_route_param('id') )
    this.archive_class = is_archive ? 'grid' : '';
    this.items = is_archive
      ? useDataStore().superGroups                   // Home > Groups
      : useDataStore().projectsInGroup(parseInt(group || id));
  }

  // /**
  //  * Fetch Data before navigation
  //  * 
  //  * @see https://router.vuejs.org/guide/advanced/data-fetching.html
  //  */
  // @Hook
  // beforeRouteEnter(to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) {
  //   next(vm => console.log(vm));
  // }

  // /**
  //  * Fetch Data when route changes and this component is already rendered
  //  * 
  //  * @see https://router.vuejs.org/guide/advanced/data-fetching.html
  //  */
  // @Hook
  // async beforeRouteUpdate(to: RouteLocationNormalized, from: RouteLocationNormalized) {
  //   this.items = undefined === to.params.id
  //     ? useDataStore().superGroups                   // Home > Groups
  //     : useDataStore().projectsInGroup(to.params.group || to.params.id);
  // }

  /**
   * @FIXME
   */
   get title(): string {
    return useDataStore()?.activeGroup?.title ?? this.info.groups_title;
  }

  /**
   * @FIXME
   */
  get description(): string {
    return useDataStore()?.activeGroup?.description ?? this.info.groups_map_description;
  }

}
</script>
