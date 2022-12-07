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
      <li v-for="(crumb, idx) in breadcrumbs">
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
import { SuperGroup } from '@/types/TSuperGroup';
import { IBreadcrumbItem } from '@/types/IBreadcrumbItem';
import { Component, Vue, Watch} from 'vue-property-decorator';
import { RouteRecord } from 'vue-router';

@Component({
  components: { },
})

export default class Breadcrumb extends Vue {
  breadcrumbs: IBreadcrumbItem[] = [];
  
  @Watch('$route.params', {
    immediate: true,
  })
  public async onRouteParamsChange() {
    //setTimeout(() => {

    // return (this.$route.path || '').split('/').filter((b:string) => b !== '');
    // console.log(this.$route)

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
    const activeGroup: SuperGroup = this.$store.getters['group/activeGroup'];

    for (let i = 0; i < route.length; i++) {

      // route name
      let name = (matched[i] || route[i]);

      // route textual link
      let text = '';

      // route params
      const params = {};

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
        text = this.$store.getters['group/macroGroup'](this.$route.params.id).title;
        name = 'organization';
      }

      title = text || title;

      breadcrumbs.push({ name, text, params });
    }

    // dynamically update document title text
    window.document.title = title + titleSeparator + (this.$store.getters['info/info'].title || 'G3W-SUITE');

    // update breadcrumbs array
    this.breadcrumbs = breadcrumbs;

    //})
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
    return '404' === this.$route.name
  }

  public getMatchedRoute(): RouteRecord {
    return this.$route.matched[this.$route.matched.length - 1];
  }

}
</script>

<style lang="scss">
  main#content {
    padding-top: calc(var(--block-spacing-vertical) / 4);
  }
</style>
