<template>
  <fragment>

    <!-- SPINNER -->
    <progress v-if="loading"></progress>

    <!-- SEARCH BOX -->
    <input
      v-if="$route.name === 'search'"
      type="search"
      id="search"
      name="search"
      v-model="search"
      :placeholder="$t('messages.menu.search_placeholder')"
      :aria-label="$t('messages.menu.search_placeholder')"
    />

    <!-- PAGE CONTENT -->
    <hgroup v-if="$route.name === 'home'">
      <h2>{{title}}</h2>
      <p v-html="description"></p>
    </hgroup>

    <div :class="$route.name === 'group' || $route.name === 'search'  ? '' : 'grid'">
      <Article
        v-for="box in boxes"
        :href="box.LogoLink"
        :id="box.Id"
        :img_url="box.Logo"
        :key="'mc_' + box.Key"
        :title="box.Title"
        :type="box.InstanceOf"
        :edit_url="box.edit_url"
        :map_url="box.map_url"
        :description="box.description"
        :class="boxtype[box.InstanceOf] + '-' + box.Id + ' boxtype_' + boxtype[box.InstanceOf]"
      />
    </div>

  </fragment>
</template>

<script lang="ts">
import Article from '@/components/Article.vue';
import Breadcrumb from '@/components/Breadcrumb.vue';
import { EBoxType } from '@/types/EBoxType';
import { Group, IGroupDict } from '@/types/TGroup';
import { Info } from '@/types/TInfo';
import { IMacroGroupDict, MacroGroup } from '@/types/TMacroGroup';
import { SuperGroup } from '@/types/TSuperGroup';
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Route } from 'vue-router';
import { mapGetters } from 'vuex';

// groups with no macrogroups and macrogroups

// interface IGWNM_AND_MG_Dict {
//   [key: string]: IGroupDict | IMacroGroupDict;
// }

@Component({
  components: { Article },
  computed: {
    ...mapGetters({
      settings: 'info/info',
    }),
  },
})

export default class Projects extends Vue {

  public settings!: Info;

  public boxtype        = EBoxType;
  public loading        = true; // loading
  public crumbs: string[] = [];

  private stackElementTab: SuperGroup[] = [];

  get search() {
    return this.$store.getters['group/search'];
  }

  set search(val: string) {
    this.$store.dispatch('group/search', {s: val});
  }

  get boxes() {
    if (this.search) {
      return this.$store.getters['group/filteredProjects'];
    }
    if (this.$route.name === 'search') {
      return this.$store.getters['group/projects'];
    }
    const elements: Array<MacroGroup | Group> = [];
    const macroGroups   = this.$store.getters['group/macroGroups'];
    const noMacroGroups = this.$store.getters['group/groupsWithNoMacroGroup'];
    for (const i in macroGroups) {
      elements.push(macroGroups[i] as MacroGroup);
    }

    for (const i in noMacroGroups) {
      elements.push(noMacroGroups[i] as Group);
    }

    if (this.$route.name === 'home') return elements;
    else if (this.$route.name === 'organization') {
      if (typeof this.$route.params.id === "undefined") return this.$store.getters['group/macroGroups'];
      else return this.$store.getters['group/macroGroups'] ? this.$store.getters['group/groupsInMacroGroup'](this.$route.params.id) : [];
    } else if (this.$route.name === 'group'){
      if (typeof this.$route.params.id === "undefined") return this.$store.getters['group/groupsWithNoMacroGroup'];
      else return this.$store.getters['group/groups'] ? this.$store.getters['group/projectsInGroup'](this.$route.params.id) : [];
    }
  }

  get title() {
    return 1 === this.crumbs.length
      ? this.settings.groups_title
      : this.$store.getters['group/activeGroup'].title || this.$store.getters['group/activeGroup'].name;
  }

  get description() {
    return 1 === this.crumbs.length
      ? this.settings.groups_map_description
      : this.$store.getters['group/activeGroup'].description;
  }

  public async mounted() {
    const { params:{id}, name } = this.$route;
    const locale = this.$i18n.locale;
    await Promise.allSettled([
      this.$store.dispatch('group/fetchMacroGroups', { locale }),
      this.$store.dispatch('group/fetchGroupsWithNoMacroGroup', { locale }),
      this.$store.dispatch('group/fetchProjects', { locale }),
    ]);
    this.loading = false;
    if (typeof id !== "undefined") {
      this.getGroups({ id: parseInt(id, 10) }, name === 'group' ? EBoxType.G: EBoxType.MG);
    }

    /**
     * @TODO make use of "$route.matched" property for dynamic breadcrumb generation?
     */

  }

  public created() {
    this.crumbs = [this.$tc(`messages.menu.${this.$route.name}`)];
  }

  public getGroups(param: { id?: number, name?: string }, type: EBoxType) {
    const { id, name } = param;
    console.log(id)
    let el: SuperGroup = new SuperGroup();
    if (EBoxType.P === type) { return false; }
    switch (type) {
      case EBoxType.MG:
        const macroGroups = this.$store.getters['group/macroGroups'];
        el = undefined !== id
          ? macroGroups[id]
          : Object.values(macroGroups).find((mc: MacroGroup) => mc.name === name);
        (el as MacroGroup).fetchGroups();
        break;
      case EBoxType.G:
        const groups = this.$store.getters['group/groups'];
        el = undefined !== id
          ? groups[id]
          : Object.values(groups).find((g: Group) => g.name === name);
        (el as Group).fetchProjects();
        break;
    }
    this.$store.dispatch('group/setActiveGroup', { sg: el });
  }


}
</script>

<style lang="scss" scoped>
  .grid {
    grid-row-gap: var(--grid-spacing-horizontal);
  }

  .grid article {
    margin: 0;
  }

  @media (min-width: 992px) {
    .grid {
      grid-template-columns: repeat(auto-fill,minmax(30%,1fr));
    }
  }
</style>
