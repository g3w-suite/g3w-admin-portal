<template>
  <fragment>

    <!-- SPINNER -->
    <progress v-if="$store.getters.showLoader"></progress>

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

    <div :class="($route.name === 'group' && $route.params.id !== undefined) || $route.name === 'search'  ? '' : 'grid'">
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
import { EBoxType } from '@/types/EBoxType';
import { Group, IGroupDict } from '@/types/TGroup';
import { Info } from '@/types/TInfo';
import { IMacroGroupDict, MacroGroup } from '@/types/TMacroGroup';
import { SuperGroup } from '@/types/TSuperGroup';
import { Component, Prop, Vue } from 'vue-property-decorator';
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

  get search() {
    return this.$store.getters['group/search'];
  }

  set search(val: string) {
    this.$store.dispatch('group/search', {s: val});
  }

  get boxes() {
    switch (this.$route.name) {

      case 'home':
        return this.$store.getters['group/superGroups'];

      case 'organization':
        return this.$route.params.id
          ? this.$store.getters['group/groupsInMacroGroup'](this.$route.params.id)
          : this.$store.getters['group/macroGroups'];

      case 'group':
        return this.$route.params.id
            ? this.$store.getters['group/projectsInGroup'](this.$route.params.id)
            : this.$store.getters['group/groupsWithNoMacroGroup'];

      default:
        return this.search
          ? this.$store.getters['group/filteredProjects']
          : this.$store.getters['group/projects'];
    }
  }

  /**
   * @FIXME show group title on "group/:id" and "organization/:id" route
   */
  get title() {
    return 1 === this.crumbs.length
      ? this.settings.groups_title
      : this.$store.getters['group/activeGroup'].title || this.$store.getters['group/activeGroup'].name;
  }

  /**
   * @FIXME show group description on "group/:id" and "organization/:id" route
   */
  get description() {
    return 1 === this.crumbs.length
      ? this.settings.groups_map_description
      : this.$store.getters['group/activeGroup'].description;
  }

  public async mounted() {
    const { params, name } = this.$route;
    const locale = this.$i18n.locale;
    this.$store.dispatch('showLoader')
    await Promise.allSettled([
      this.$store.dispatch('group/fetchMacroGroups', { locale }),
      this.$store.dispatch('group/fetchGroupsWithNoMacroGroup', { locale }),
      this.$store.dispatch('group/fetchProjects', { locale }),
    ])
    this.$store.dispatch('hideLoader')
    if (undefined !== params.id) {
      this.setActiveGroup(
        {
          id: params.id
        },
        name === 'group'
          ? EBoxType.G
          : EBoxType.MG
      );
    }
  }

  public created() {
    this.crumbs = [this.$tc(`messages.menu.${this.$route.name}`)];
  }

  public setActiveGroup(param: { id?: number | string }, type: EBoxType.G | EBoxType.MG) {
    const { id } = param;
    let el: SuperGroup = new SuperGroup();

    switch (type) {

      case EBoxType.MG:
        const macroGroups = this.$store.getters['group/macroGroups'];
        el = undefined !== id
          ? macroGroups[id]
          : Object.values(macroGroups).find((mc: MacroGroup) => mc.title === id);
        (el as MacroGroup).fetchGroups();
        break;

      case EBoxType.G:
        const groups = this.$store.getters['group/groups'];
        el = undefined !== id
          ? groups[id]
          : Object.values(groups).find((g: Group) => g.name === id);
        (el as Group).fetchProjects();
        break;

      default:
        this.$router.push({name: '404'});
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
