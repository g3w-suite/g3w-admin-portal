<template>
  <div class="d-flex flex-column">
    <Search v-if="($route.name === 'mappe' || is_pa )" class="w-100 d-flex search_box mb-4" :class="[is_pa? '' : 'd-flex d-md-none']" v-model="search"></Search>
    <div v-if="loading" class="bar-loader"></div>
    <TabNav v-if="!search.length" :activeClass="activeClass" :tabs="tabs" @click="handleTabClick" id="TabNav" :class="{'g3w-disabled': loading}"></TabNav>
    <div class="tab-content" id="TabContent" :class="{'g3w-disabled': loading}">
      <div aria-labelledby="nav-tab1-tab" class="tab-pane p-4 fade show active" id="nav-tab1" role="tabpanel">
        <div class="w-100">
          <div class="p-2 h-100 bg-transparent">
            <h2 v-if="!search.length" class="sottotitolo font-abril">{{title}}</h2>
            <p v-if="!search.length" class="descrizione" v-html="description"></p>
            <div class="row projects-content">
              <tab-box v-for="mc in boxes" :href="mc.LogoLink" :id="mc.Id" :img_url="mc.Logo" :key="'mc_' + mc.Key" :title="mc.Title" :type="mc.InstanceOf" :edit_url="mc.edit_url" :map_url="mc.map_url" :description="mc.description" @click="handleBoxClick" :class="{ 'col-12 col-md-6 col-lg-4 mb-4': mc.InstanceOf != eboxtype.P,'col-12 mb-4': mc.InstanceOf == eboxtype.P}">
              </tab-box>
            </div>
          </div>
        </div>
      </div>
    </div>
    <b-modal centered backdrop id="thumbnailModal" size="xl" :title="$store.getters['modal/title']">
      <template v-slot:default>
        <div>
          <img :src="$store.getters['modal/url']" class="w-100">
        </div>
      </template>
      <template v-slot:modal-footer="footer">
        <div></div>
      </template>
    </b-modal>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import TabButton from '@/components/TabButton.vue';
  import {Group, IGroupDict} from '@/datastore/types/Group';
  import {IMacroGroupDict, MacroGroup} from '@/datastore/types/MacroGroup';
  import TabBox from '@/components/TabBox.vue';
  import {EBoxType} from '@/datastore/interfaces/RequestsInterfaces';
  import {SuperGroup} from '@/datastore/types/SuperGroup';
  import TabNav from '@/components/TabNav.vue';
  import {mapGetters} from 'vuex';
  import {Info} from '@/datastore/types/Info';
  import Search from '@/components/Search.vue';

  // groups with no macrogroups and macrogroups

  interface IGWNM_AND_MG_Dict {
    [key: string]: IGroupDict | IMacroGroupDict;
  }

  @Component({
    components: {TabNav, TabBox, TabButton, Search},
    computed: {
      ...mapGetters({
        settings: 'info/info',
      })
    },
  })

  export default class TabWidget extends Vue {

    get search() {
      return this.$store.getters['group/search'];
    }

    set search(val: string) {
      this.$store.dispatch('group/search', {s: val});
    }

    get boxes() {
      if (this.search) {
        return this.$store.getters['group/fitleredProjects'];
      }
      const els: Array<MacroGroup | Group> = [];
      if (this.tabs.length == 1) {
        let obj = this.$store.getters['group/macroGroups'];
        for (const i in obj) {
          els.push(obj[i] as MacroGroup);
        }
        obj = this.$store.getters['group/groupsWithNoMacroGroup'];
        for (const i in obj) {
          els.push(obj[i] as Group);
        }
        return els;
      } else if (this.tabs.length > 1) {
        const activeEl = this.stackElementTab[this.stackElementTab.length - 1];
        if (activeEl.InstanceOf == EBoxType.MG) {
          return (activeEl as MacroGroup).Groups;
        }
        if (activeEl.InstanceOf == EBoxType.G) {
          return (activeEl as Group).Projects;
        }
      }
    }

    get title() {
      if (this.tabs.length == 1) {
        return this.settings.groups_title;
      }
      return this.$store.getters['group/activeGroup'].title || this.$store.getters['group/activeGroup'].name;
    }

    get description() {
      if (this.tabs.length == 1) {
        return this.settings.groups_map_description;
      }
      return this.$store.getters['group/activeGroup'].description;
    }
    public eboxtype = EBoxType;

    public boxtype = EBoxType;

    private is_pa = (window as any).IS_PA || false;

    private loading = true; // loading

    @Prop(String) private readonly activeClass!: string;

    private tabs: string[] = [];
    private stackElementTab: SuperGroup[] = [];
    private settings!: Info;

    public async mounted() {
      const {id, name} = this.$route.params;
      const promises = [];
      promises.push(this.$store.dispatch('group/fetchMacroGroups', {locale: this.$i18n.locale}));
      promises.push(this.$store.dispatch('group/fetchGroupsWithNoMacroGroup', {locale: this.$i18n.locale}));
      promises.push(this.$store.dispatch('group/fetchProjects', {locale: this.$i18n.locale}));
      await Promise.allSettled(promises);
      this.loading = false;
      if (id !== undefined) this.getMacroGroupsOrGroups({id: 1*id}, 2);
      else if (name !== undefined) this.getMacroGroupsOrGroups({name}, 2);
    }

    public created() {
      this.tabs = [this.$tc(`messages.menu.${this.$route.name}`).toUpperCase()];
    }

    private handleTabClick(idx: number) {
      this.tabs.splice(idx + 1, this.tabs.length);
      this.stackElementTab.splice(idx, this.stackElementTab.length);
      this.$store.dispatch('group/setActiveGroup', {sg: this.stackElementTab[this.stackElementTab.length - 1]});
    }

    private getMacroGroupsOrGroups(param: {id: number, name: string}, type: EBoxType){
      const {id, name} = param;
      let el: SuperGroup = new SuperGroup();
      if (type == EBoxType.P) return false;
      switch (type) {
        case EBoxType.MG:
          const macroGroups = this.$store.getters['group/macroGroups'];
          el = id !== undefined ? macroGroups[id] : Object.values(macroGroups).find((macroGroup: MacroGroup) => macroGroup.name === name);
          (el as MacroGroup).fetchGroups();
          break;
        case EBoxType.G:
          const groups = this.$store.getters['group/groups'];
          el = id !== undefined ? groups[id] : Object.values(groups).find((group: Group) => group.name === name);
          (el as Group).fetchProjects();
          break;
      }
      this.$store.dispatch('group/setActiveGroup', {sg: el});
      this.stackElementTab = this.stackElementTab.concat(el);
      // @ts-ignore
      this.tabs = this.tabs.concat(el.title || el.name);
    }

    private handleBoxClick(id: number, type: EBoxType) {
      this.getMacroGroupsOrGroups({id}, type);
    }
  }
</script>

<style lang="scss">
  .search_box {
    height: 50px;
  }
  #thumbnailModal {
    .modal-footer {
      height: 0;
      padding: 0;
    }
    .modal-body {
      padding: 24px;
    }
  }
  .modal-backdrop {
    opacity: 0.7;
  }

</style>
