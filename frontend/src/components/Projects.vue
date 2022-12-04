<template>
  <section>
    <hgroup v-if="$route.params.id">
      <h2>{{ title }}</h2>
      <p v-html="description"></p>
    </hgroup>
    <div :class="($route.name === 'group' && $route.params.id !== undefined)
    || $route.name === 'search' || $route.params.group !== undefined ? '' : 'grid'">
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
  </section>
</template>

<script lang="ts">
import Article from '@/components/Article.vue';
import { EBoxType } from '@/types/EBoxType';
import { MacroGroup } from '@/types/TMacroGroup';
import { Group } from '@/types/TGroup';
import { Project } from '@/types/TProject';
import { Info } from '@/types/TInfo';
import { Component, Prop, Vue , Watch} from 'vue-property-decorator';
import { mapGetters } from 'vuex';

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

  /**
   * @TODO remove switch($route.name) and get all "boxes" as throught the component @Prop
   */
  /**
   * @FIXME show group title on "group/:id" and "organization/:id" route
   */
  get title(): string {
    const sg: MacroGroup | Group = this.$store.getters['group/activeGroup'];
    return sg ? sg.title : this.settings.groups_title;
  }

  /**
   * @FIXME show group description on "group/:id" and "organization/:id" route
   */
  get description(): string {
    const sg: MacroGroup | Group = this.$store.getters['group/activeGroup'];
    return sg ? sg.description : this.settings.groups_map_description;
  }

  public async mounted() {
    await this.$nextTick();
    console.log(this.$route.params)
    window.scrollTo(0,0);
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
