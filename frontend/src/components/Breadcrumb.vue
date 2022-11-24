<template>
  <nav
    v-if="breadcrumbs.length > 1"
    aria-label="breadcrumb"
    class="container"
  >
    <ul>
      <li v-for="(name, idx) in breadcrumbs ">
        <router-link
          :to="{ name }"
          :aria-current="idx + 1 != breadcrumbs.length ? undefined : 'page'"
        >
          {{ $t('messages.menu.' + name) }}
        </router-link>
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
  @Prop({ type: Array, required: true }) public readonly breadcrumbs!: Array<JSON>;
}
</script>

<style lang="scss" scoped>
</style>
