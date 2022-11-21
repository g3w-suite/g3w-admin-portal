<template>
  <fragment>
    <h1>Error 404</h1>
  </fragment>
</template>

<script lang="ts">
import { Fragment } from 'vue-fragment';
import { Component, Vue } from 'vue-property-decorator';

@Component({
  components: { Fragment },
})
export default class NotFound extends Vue { }
</script>

<style lang="scss" scoped>
</style>