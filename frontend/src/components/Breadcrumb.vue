<template>
  <nav
    v-if="breadcrumbs.length > 1"
    aria-label="breadcrumb"
    class="container"
  >
    <ul>
      <li v-for="(name, idx) in breadcrumbs ">
        <router-link
          :to="{ name: name.name }"
          :aria-current="idx + 1 != breadcrumbs.length ? undefined : 'page'"
        >
          {{ $t('messages.menu.' + name.name) }}
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
      const titleSeparator = ' | ';

      let breadcrumbs = [ { name: title, path } ];

      const route   = (this.$route.path                        ).split('/');
      const matched = (this.$route.matched[1].meta.crumbs || '').split('/');

      console.log(this.$route);
      console.log(route, matched);

      for(let i = 2; i < route.length; i++)
      {
        let name = (matched[i] || route[i]);
        console.log(name);
        
        if (route[i] == '') continue;
        if (i == 2 && route.length >= 2 ) title = '';
        else title += titleSeparator;

        title += this.$i18n.t('messages.menu.' + name);
        path  += '/'  + name;
    
        breadcrumbs.push({ name: name, path: path });
      }

      window.document.title = title + titleSeparator + (this.$store.getters['info/info'].title || 'G3W-SUITE');

      return breadcrumbs;
  }

  // public async beforeRouteUpdate(to: Route, from: Route) {
  //   this.breadcrumbs = 
  // }
}
</script>

<style lang="scss" scoped>
</style>
