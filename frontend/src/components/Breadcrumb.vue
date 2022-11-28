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
          :aria-current="idx + 1 != breadcrumbs.length ? undefined : 'page'"
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
      const titleSeparator = ' | ';

      let breadcrumbs = [ { name: title, path, text: '' } ];

      const route   = (this.$route.path                        ).split('/');
      const matched = (this.$route.matched[1].meta.crumbs || '').split('/');


      console.log(this.$route);
      console.log(route, matched);

      for(let i = 2; i < route.length; i++) {
        let text;
        let name = (matched[i] || route[i]);

        console.log(route[i]);

        if (route[i] == '') continue;

        if (i == 2 && route.length >= 2 ) title = '';
        else title += titleSeparator;

        title += this.$i18n.t('messages.menu.' + name);
        path  += '/'  + name;
        // in case of group router, get current active name
        if ((i > 2 && i === route.length - 1)) {
          const {name} = this.$route;
          if (name == 'organization') {
            const macro = this.$store.getters['group/macroGroups'] && this.$store.getters['group/macroGroups'][route[i]];
            text = macro ? macro.title : '';
          } else if (name === 'group') {
            const group = this.$store.getters['group/groups'] && this.$store.getters['group/groups'][route[i]];
            text = group ? group.name : '';
          }
        }
        breadcrumbs.push({
          name: name,
          path: path,
          text
        })
      }

      window.document.title = title + titleSeparator + (this.$store.getters['info/info'].title || 'G3W-SUITE');

      return breadcrumbs;
  }
}
</script>

<style lang="scss" scoped>
</style>
