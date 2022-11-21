<template>
  <nav aria-label="breadcrumb">
    <ul>
      <li v-for="(text, idx) in tabs">
        <a v-if="idx + 1 != tabs.length" @click.prevent.stop="$emit('click', idx)">{{text}}</a>
        <template v-else>{{text}}</template>
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
  @Prop({ type: Array, required: true }) public readonly tabs!: string[];
}
</script>

<style lang="scss" scoped>
  nav[aria-label="breadcrumb"] a {
    cursor: pointer;
  }
</style>
