<template>
  <nav
    v-if="breadcrumbs.length > 1"
    aria-label="breadcrumb"
    class="container"
  >
    <ul>
      <li v-for="(route, idx) in breadcrumbs ">
        <router-link
          :to="{ name: route.name }"
          :aria-current="idx + 1 != breadcrumbs.length ? undefined : 'page'"
        >
          {{ route.text }}
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { RouteRecord } from 'vue-router';

@Component({
  components: { },
})

export default class Breadcrumb extends Vue {
  @Prop({ type: Array, required: true }) public readonly breadcrumbs!: Array<JSON>;
}
</script>

<style lang="scss" scoped>
  nav[aria-label="breadcrumb"] a {
    cursor: pointer;
  }
</style>
