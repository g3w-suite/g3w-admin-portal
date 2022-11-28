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
    
    if (!this.$route) return [];

      let path = '/' + this.$i18n.locale;
      let title = (/*this.root ||*/ 'home');
      const titleSeparator = ' - ';

      let breadcrumbs = [ { name: title, path, text: '' } ];

      const route   = (this.$route.path                        ).split('/');
      const matched = (this.$route.matched[1].meta.crumbs || '').split('/');

      // ignore parent ":lang" route (ref: router.ts)
      route.shift();
      route.shift();
      matched.shift();

      console.log(this.$route);
      console.log(route, matched);

      let activeGroup = this.$store.getters['group/activeGroup'];

      for(let i = 0; i < route.length; i++) {

        console.log(route[i]);

        if (route[i] == '') continue;

        if (i == 0) title = '';       // 0 = home
        else title += titleSeparator;

        let text;
        let name = (matched[i] || route[i]);
        let activeCrumb = (activeGroup && activeGroup.name) || '';

        title += this.isLastCrumb(route, i)
          ? activeCrumb
          : this.$i18n.t('messages.menu.' + name);

        path  += '/'  + name;

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

        breadcrumbs.push({
          name: name,
          path: path,
          // dynamically generate breadcrumb text for current activeGroup
          text: this.isLastCrumb(route, i) ? activeCrumb : ''
        })
      }

      // dynamically update document title text
      window.document.title = title + titleSeparator + (this.$store.getters['info/info'].title || 'G3W-SUITE');

      return breadcrumbs;
  }

  public isLastCrumb(breadcrumbs: Array<any>, i: number) {
    return i > 0 && i === breadcrumbs.length - 1;
  }

  // public async beforeRouteUpdate(to: Route, from: Route) {
  //   this.breadcrumbs =
  // }

}
</script>

<style lang="scss" scoped>
</style>
