<template>
  <nav v-if="hasBreadcrumbs" aria-label="breadcrumb" class="container">
    <ul>
      <template v-for="(crumb, idx) in $breadcrumbs.value">
        <li v-if="showCurrentCrumb || !crumb.current">
          <router-link
            :to="crumb.link"
            :aria-current="crumb.current ? 'page' : undefined"
          >{{ crumb.label }}</router-link>
        </li>
      </template>
    </ul>
  </nav>
</template>
  
<script lang="ts">
import { Component, Vue, Prop } from 'vue-facing-decorator';

@Component
export default class Breadcrumbs extends Vue {

  @Prop({ default: true }) public readonly showCurrentCrumb!: boolean;
  
  get hasBreadcrumbs() {
    return this.$breadcrumbs?.value?.length && (this.showCurrentCrumb || !this.$breadcrumbs.value[0].current)
  }

}
</script>