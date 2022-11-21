<template>
  <fragment>

    <!-- SPINNER -->
    <progress v-if="loading"></progress>

    <!-- SEARCH BOX -->
    <input
      type="search"
      id="search"
      name="search"
      v-model="search"
      :placeholder="$t('messages.menu.search')"
      @input="$emit('input', $event.target.value)"
    />

    <!-- BREADCRUMBS -->
    <Breadcrumb
      v-if="!search.length"
      id="breadcrumb"
      :tabs="tabs"
      @click="handleTabClick"
    />

    <!-- PAGE CONTENT -->
    <hgroup v-if="!search.length">
      <h2>{{title}}</h2>
      <p v-html="description"></p>
    </hgroup>

    <div class="grid">
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
        :class="'boxtype_' + boxtype[box.InstanceOf]"
        @click="getGroups({ id: box.Id }, box.InstanceOf)"
      />
    </div>

    <!-- BREADCRUMBS -->
    <Breadcrumb
      v-if="!search.length"
      id="breadcrumb"
      :tabs="tabs"
      @click="handleTabClick"
    />

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
import { mapGetters } from 'vuex';

// groups with no macrogroups and macrogroups

// interface IGWNM_AND_MG_Dict {
//   [key: string]: IGroupDict | IMacroGroupDict;
// }

@Component({
  components: { Breadcrumb, Article },
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
  public tabs: string[] = [];

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
    const elements: Array<MacroGroup | Group> = [];
    if (this.tabs.length === 1) {
      const macroGroups   = this.$store.getters['group/macroGroups'];
      const noMacroGroups = this.$store.getters['group/groupsWithNoMacroGroup'];
      for (const i in macroGroups) {
        elements.push(macroGroups[i] as MacroGroup);
      }
      for (const i in noMacroGroups) {
        elements.push(noMacroGroups[i] as Group);
      }
      return elements;
    } else if (this.tabs.length > 1) {
      const activeEl = this.stackElementTab[this.stackElementTab.length - 1];
      if (activeEl.InstanceOf === EBoxType.MG) {
        return (activeEl as MacroGroup).Groups;
      }
      if (activeEl.InstanceOf === EBoxType.G) {
        return (activeEl as Group).Projects;
      }
    }
  }

  get title() {
    return 1 === this.tabs.length
      ? this.settings.groups_title
      : this.$store.getters['group/activeGroup'].title || this.$store.getters['group/activeGroup'].name;
  }

  get description() {
    return 1 === this.tabs.length
      ? this.settings.groups_map_description
      : this.$store.getters['group/activeGroup'].description;
  }

  public async mounted() {
    const { id, name } = this.$route.params;
    const locale = this.$i18n.locale;
    await Promise.allSettled([
      this.$store.dispatch('group/fetchMacroGroups', { locale }),
      this.$store.dispatch('group/fetchGroupsWithNoMacroGroup', { locale }),
      this.$store.dispatch('group/fetchProjects', { locale }),
    ]);
    this.loading = false;
    if (undefined !== id) {
      this.getGroups({ id: 1 * parseInt(id, 10) }, EBoxType.G);
    } else if (undefined !== name) {
      this.getGroups({ name }, EBoxType.G);
    }
  }

  public created() {
    this.tabs = [this.$tc(`messages.menu.${this.$route.name}`).toUpperCase()];
  }

  public handleTabClick(idx: number) {
    this.tabs.splice(idx + 1, this.tabs.length);
    this.stackElementTab.splice(idx, this.stackElementTab.length);
    this.$store.dispatch('group/setActiveGroup', {sg: this.stackElementTab[this.stackElementTab.length - 1]});
  }

  public getGroups(param: { id?: number, name?: string }, type: EBoxType) {
    const { id, name } = param;
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
    this.stackElementTab = this.stackElementTab.concat(el);
    this.tabs = this.tabs.concat(el.title || el.name);
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
