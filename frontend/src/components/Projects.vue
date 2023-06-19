<template>
  <div>
    <Article v-for="item in items" :item="item" :key="item._vue_uid" />
  </div>
</template>

<script lang="ts">
import Article from '@/components/Article.vue';
import { Group } from '@/types/TGroup';
import { MacroGroup } from '@/types/TMacroGroup';
import { Project } from '@/types/TProject';
import { Component, Prop, Vue } from 'vue-facing-decorator';

@Component({
  components: { Article },
})

export default class Projects extends Vue {
  @Prop public readonly items!: Array<MacroGroup | Group | Project>;
}
</script>

<style lang="css" scoped>
  .grid {
    grid-row-gap: var(--grid-spacing-horizontal);
  }

  .grid :deep(article) {
    margin: 0;
  }

  @media (min-width: 992px) {
    .grid {
      grid-template-columns: repeat(auto-fill,minmax(30%,1fr));
    }
  }
</style>
