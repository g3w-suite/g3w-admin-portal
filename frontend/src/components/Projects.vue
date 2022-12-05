<template>
  <div>
    <Article
      v-for="box in items"
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
</template>

<script lang="ts">
import Article from '@/components/Article.vue';
import { EBoxType } from '@/types/EBoxType';
import { Group } from '@/types/TGroup';
import { MacroGroup } from '@/types/TMacroGroup';
import { Project } from '@/types/TProject';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
  components: { Article },
})

export default class Projects extends Vue {
  @Prop(Array) public readonly items!: Array<MacroGroup | Group | Project>;

  public boxtype        = EBoxType;

  public async mounted() {
    await this.$nextTick();
    window.scrollTo(0, 0);
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
