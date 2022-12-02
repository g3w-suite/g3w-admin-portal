<template>
  <section>
    <hgroup v-if="$route.params.id">
      <h2>{{ title }}</h2>
      <p v-html="description"></p>
    </hgroup>
    <div :class="($route.name === 'group' && $route.params.id !== undefined) || $route.name === 'search'  ? '' : 'grid'">
      <Article
        v-for="box in boxes || pboxes"
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
  </section>
</template>

<script lang="ts">
import Article from '@/components/Article.vue';
import { EBoxType } from '@/types/EBoxType';
import { MacroGroup, IMacroGroupDict } from '@/types/TMacroGroup';
import { Group, IGroupDict } from '@/types/TGroup';
import { Project } from '@/types/TProject';
import { Info } from '@/types/TInfo';
import { SuperGroup } from '@/types/TSuperGroup';
import { Component, Prop, Vue , Watch} from 'vue-property-decorator';
import { mapGetters } from 'vuex';
import { Route } from 'vue-router';

// groups with no macrogroups and macrogroups

// interface IGWNM_AND_MG_Dict {
//   [key: string]: IGroupDict | IMacroGroupDict;
// }

// Component.registerHooks([
//   'beforeRouteUpdate'
// ])

@Component({
  components: { Article },
  computed: {
    ...mapGetters({
      settings: 'info/info',
    }),
  },
})

export default class Projects extends Vue {
  @Prop(Array) public readonly boxes!: Array<MacroGroup | Group | Project>;

  public settings!: Info;

  public boxtype        = EBoxType;
  // public crumbs: string[] = [];

  /**
   * @TODO remove switch($route.name) and get all "boxes" as throught the component @Prop
   */
  public pboxes: Array<MacroGroup | Group | Project> = this.boxes || [];
  @Watch('$route', {immediate: false})
  async setBoxes(to: Route, from: Route) {
    const {params:{id}, name} = to;
    switch (name) {
      case 'organization':
        id && await this.setActiveGroup({ id }, EBoxType.MG );
        this.pboxes = id
          ? this.$store.getters['group/groupsInMacroGroup'](id)
          : this.$store.getters['group/macroGroups'];
        break;

      case 'group':
        id && await this.setActiveGroup({ id}, EBoxType.G );
        this.pboxes = id
            ? this.$store.getters['group/projectsInGroup'](id)
            : this.$store.getters['group/groupsWithNoMacroGroup'];
        break;
      default:
    }
    // got o window top after change
    window.scrollTo(0,0);
  }

  /**
   * @FIXME show group title on "group/:id" and "organization/:id" route
   */
  get title(): string {
    const sg: MacroGroup | Group = this.$store.getters['group/activeGroup'];
    return sg ? sg.title : this.settings.groups_title;
    // return 1 === this.crumbs.length
    //   ? this.settings.groups_title
    //   : this.$store.getters['group/activeGroup'].title || this.$store.getters['group/activeGroup'].name;
  }

  /**
   * @FIXME show group description on "group/:id" and "organization/:id" route
   */
  get description(): string {
    const sg: MacroGroup | Group = this.$store.getters['group/activeGroup'];
    return sg ? sg.description : this.settings.groups_map_description;
  //   return 1 === this.crumbs.length
  //     ? this.settings.groups_map_description
  //     : this.$store.getters['group/activeGroup'].description;
  }

  public async mounted() {
    this.$store.dispatch('showLoader');
    const locale = this.$i18n.locale;
    await Promise.allSettled([
      this.$store.dispatch('group/fetchMacroGroups', { locale }),
      this.$store.dispatch('group/fetchGroupsWithNoMacroGroup', { locale }),
      this.$store.dispatch('group/fetchProjects', { locale }),
    ]);
    this.$store.dispatch('hideLoader');
    this.setBoxes(this.$route, this.$route);
    window.scrollTo(0,0);
  }

  // public created() {
  //   this.crumbs = [this.$tc(`messages.menu.${this.$route.name}`)];
  // }

  public async setActiveGroup(param: { id?: number | string }, type: EBoxType.G | EBoxType.MG) {
    const { id } = param;
    let sg: SuperGroup = new SuperGroup();

    switch (type) {

      case EBoxType.MG:
        const macroGroups = this.$store.getters['group/macroGroups'];
        sg = undefined !== id
          ? macroGroups[id]
          : Object.values(macroGroups).find((mc) => (mc as MacroGroup).title === id);
        await (sg as MacroGroup).fetchGroups();
        break;

      case EBoxType.G:
        const groups = this.$store.getters['group/groups'];
        sg = undefined !== id
          ? groups[id]
          : Object.values(groups).find((g) => (g as Group).name === id);
        await (sg as Group).fetchProjects();
        break;

      default:
        this.$router.push({name: '404'});
        break;
    }

    this.$store.dispatch('group/setActiveGroup', { sg });
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
