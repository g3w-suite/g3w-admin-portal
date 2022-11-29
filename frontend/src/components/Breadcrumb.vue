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
      <li v-for="(crumb, idx) in breadcrumbs ">
        <router-link
          :to="{ name: crumb.name }"
          :aria-current="isLastCrumb(breadcrumbs, idx) ? 'page' : undefined"
        >
          {{ crumb.text ? crumb.text : $t('messages.menu.' + crumb.name) }}
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
  components: { },
})

export default class Breadcrumb extends Vue {
  // @Prop({ type: Array, required: true }) public readonly breadcrumbs!: JSON[];

  get breadcrumbs() {
    // return (this.$route.path || '').split('/').filter((b:string) => b !== '');

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

    const activeGroup = this.$store.getters['group/activeGroup'];

    for (let i = 0; i < route.length; i++) {

      // skip empty routes
      if (route[i] === '') { continue; }

      if (i === 0) { title = ''; } else { title += titleSeparator; }

      const name = (matched[i] || route[i]);
      const activeCrumb = (activeGroup && activeGroup.name) || '';

      path  += '/'  + name;

      title += this.isLastCrumb(route, i)
        ? activeCrumb
        : this.$i18n.t('messages.menu.' + name);

      /**
       * @FIXME title tab names for "group" and "organization"
       */
      // in case of group router, get current active name
      // if (this.isLastCrumb(route, i)) {
      //   if ('organization' === this.$route.name) {
      //     const macro = this.$store.getters['group/macroGroups'] && this.$store.getters['group/macroGroups'][route[i]];
      //     text = macro ? macro.title : '';
      //   } else if ('group' === this.$route.name) {
      //     const group = this.$store.getters['group/groups'] && this.$store.getters['group/groups'][route[i]];
      //     text = group ? group.name : '';
      //   }
      // }
      // breadcrumbs.push({
      //   name: name,
      //   path: path,
      //   text
      // });

      // dynamically generate breadcrumb text for current activeGroup
      const text = this.isLastCrumb(route, i) ? activeCrumb : '';

      breadcrumbs.push({
        name,
        path,
        text,
      });

      title = text || title;
    }

    // dynamically update document title text
    window.document.title = title + titleSeparator + (this.$store.getters['info/info'].title || 'G3W-SUITE');

    return breadcrumbs;
  }

  public isLastCrumb(breadcrumbs: any[], i: number) {
    return i > 0 && i === breadcrumbs.length - 1;
  }

  // public async beforeRouteUpdate(to: Route, from: Route) {
  //   this.breadcrumbs =
  // }

}
</script>

<style lang="scss" scoped>
</style>
