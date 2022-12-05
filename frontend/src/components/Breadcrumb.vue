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
    v-if="!$store.getters.showLoader && breadcrumbs.length > 1"
    aria-label="breadcrumb"
    class="container"
  >
    <ul>
      <li v-for="(crumb, idx) in breadcrumbs ">
        <router-link
          :to="{ name: crumb.name , params: crumb.params}"
          :aria-current="isLastCrumb(breadcrumbs, idx) ? 'page' : undefined">
          {{ crumb.text ? crumb.text : $t('messages.menu.' + crumb.name) }}
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts">
import { SuperGroup } from '@/types/TSuperGroup';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
  components: { },
})

export default class Breadcrumb extends Vue {
  // @Prop({ type: Array, required: true }) public readonly breadcrumbs!: JSON[];

  get breadcrumbs() {
    // return (this.$route.path || '').split('/').filter((b:string) => b !== '');
    const {id, group} = this.$route.params;
    if (!this.$route) {
      console.warn('[vue-router] dependency is missing');
      return [];
    }

    let path = '/' + this.$i18n.locale;
    let title = 'Home';
    const titleSeparator = ' - ';

    const breadcrumbs = [ { name: 'home', path, text: '' } ];

    // 404 page
    if ('404' === this.$route.name) {
      breadcrumbs.push({ name: '404', path: path + '404', text: '404' });
      return breadcrumbs;
    }

    const route   = (this.$route.path                        ).split('/');
    const matched = (this.$route.matched[1].meta.crumbs || '').split('/');

    // ignore parent ":lang" route (ref: router.ts)
    route.shift();
    route.shift();
    matched.shift();

    const activeGroup: SuperGroup = this.$store.getters['group/activeGroup'];

    for (let i = 0; i < route.length; i++) {

      // skip empty routes
      if (route[i] === '') { continue; }

      if (i === 0) { title = ''; } else { title += titleSeparator; }

      let name = (matched[i] || route[i]);
      const activeCrumb = (activeGroup && activeGroup.title) || '';

      path  += '/'  + name ;

      title += this.isLastCrumb(route, i)
        ? activeCrumb
        : this.$i18n.t('messages.menu.' + name);

      // dynamically generate breadcrumb text for current activeGroup
      let params: Object = {};

      if (group) {
        params.id = this.isPreLastCrumb(route, i) ? id : undefined;
        params.group = this.isLastCrumb(route, i) ? group : undefined;
      }
      const text = group && this.isPreLastCrumb(route, i) ? this.$store.getters['group/macroGroup'](id).title : this.isLastCrumb(route, i) ? activeCrumb : '';
      name = group && this.isPreLastCrumb(route, i) ? 'organization' : name;

      if (this.$route.name === 'organization') {
        if (i !== 0) breadcrumbs.push({ name , path, text, params});
      } else breadcrumbs.push({ name , path, text, params});

      title = text || title;
    }

    // dynamically update document title text
    window.document.title = title + titleSeparator + (this.$store.getters['info/info'].title || 'G3W-SUITE');

    return breadcrumbs;
  }

  public isPreLastCrumb(breadcrumbs: any[], i: number) {
    return i > 0 && i === breadcrumbs.length - 2;
  }

  public isLastCrumb(breadcrumbs: any[], i: number) {
    return i > 0 && i === breadcrumbs.length - 1;
  }

  // public async beforeRouteUpdate(to: Route, from: Route) {
  //   this.breadcrumbs =
  // }

}
</script>

<style lang="scss">
main#content {
  padding-top: calc(var(--block-spacing-vertical) / 4);
}
</style>
