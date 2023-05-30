<!--
/**
 * Reusable Vue Breadcrumb component
 *
 * @see https://github.com/NxtChg/pieces/tree/master/js/vue/vs-crumbs
 * @see https://github.com/samturrell/vue-breadcrumbs/
 *
 * @requires vue-router
 */
-->
<template>
  <nav
    v-if="breadcrumbs.length > 1"
    aria-label="breadcrumb"
    class="container"
  >
    <ul>
      <li v-for="(crumb, idx) in breadcrumbs" :class="crumb.name">
        <router-link
          :to="{ name: crumb.name, params: crumb.params }"
          :aria-current="isLastCrumb(breadcrumbs, idx) ? 'page' : undefined">
          {{ crumb.text ? crumb.text : $t('messages.menu.' + crumb.name) }}
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts">
import { Component, Vue, Watch} from 'vue-facing-decorator';
import { RouteParamsRaw, RouteRecord } from 'vue-router';

import { SuperGroup } from '@/types/TSuperGroup';
import { useDataStore } from '@/stores';

interface IBreadcrumbItem {
  name: string;
  text?: string;
  params?: RouteParamsRaw;
}

@Component
export default class Breadcrumb extends Vue {

  public breadcrumbs: IBreadcrumbItem[] = [];

  @Watch('$route.params', {
    immediate: true,
  })
  public async onRouteParamsChange() {
    // 404 page
    if (this.isErrorPage()) {
      return [{ name: 'home' }, { name: '404' }];
    }

    let title = 'Home';
    const titleSeparator = ' - ';

    const breadcrumbs: IBreadcrumbItem[] = [ { name: 'home' } ];

    const route   = (this.$route.path                        ).split('/');
    const matched = (this.getMatchedRoute().meta.crumbs || '').split('/');

    // ignore parent ":lang" route (ref: router.ts)
    route.shift();
    route.shift();
    matched.shift();

    // activeGroup contains a reference to current active element (last crumb)
    const activeGroup: SuperGroup | null = useDataStore().activeGroup;

    console.log('active', activeGroup);

    for (let i = 0; i < route.length; i++) {

      // route name
      let name = (matched[i] || route[i]);

      // route textual link
      let text = '';

      // route params
      const params: RouteParamsRaw /*{ [key: string]: string }*/ = {};

      // active crumb item (last item of array)
      const activeCrumb = (activeGroup && activeGroup.title) || '';

      // skip empty routes
      if (this.isEmptyRoute(route[i])) { continue; }

      // hide root crumb in document title ('home')
      if (this.isFirstCrumb(route, i)) { title = ''; } else { title += titleSeparator; }

      // push document element title (crumb name)
      if (this.isLastCrumb(route, i)) {
        title += activeCrumb;
      } else {
        title += this.$i18n.t('messages.menu.' + name);
      }

      /** @HOTFIX for Home > Macgroup > ID */
      if (this.isLastSecondCrumb(route, i)) {
        params.id = this.$route.params.id;
      }

      /** @HOTFIX for Home > Macgroup > ID > Subgroup */
      if (this.isLastCrumb(route, i)) {
        params.group = this.$route.params.group;
      }

      // set active crumb item textual link (last crumb)
      if (this.isLastCrumb(route, i)) {
        text = activeCrumb;
      }

      /** @HOTFIX for Home > Macgroup > ID */
      /** @HOTFIX for Home > Macgroup > ID > Subgroup */
      if (this.isLastSecondCrumb(route, i) && this.$route.params.group) {
        text = useDataStore().macroGroup(this.$route.params.id).title;
        name = 'organization';
      }

      title = text || title;

      breadcrumbs.push({ name, text, params });
    }

    console.log(breadcrumbs, this.$route, activeGroup, matched, route)

    // dynamically update document title text
    window.document.title = title + titleSeparator + (useDataStore().info.title || 'G3W-SUITE');

    // update breadcrumbs array
    this.breadcrumbs = breadcrumbs;

    // })
  }

  public isLastSecondCrumb(breadcrumbs: any[], i: number): boolean {
    return i > 0 && i === breadcrumbs.length - 2;
  }

  public isLastCrumb(breadcrumbs: any[], i: number): boolean {
    return i > 0 && i === breadcrumbs.length - 1;
  }

  public isFirstCrumb(breadcrumbs: any[], i: number): boolean {
    return i === 0;
  }

  public isEmptyRoute(path: string): boolean {
    return path === '';
  }

  public isErrorPage(): boolean {
    return '404' === this.$route.name;
  }

  public getMatchedRoute(): RouteRecord {
    return this.$route.matched[this.$route.matched.length - 1];
  }

}
</script>

<style lang="css">
  main#content {
    padding-top: calc(var(--block-spacing-vertical) / 4);
  }
</style>
