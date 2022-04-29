<template>
  <div class="card-wrapper card-space">
    <div class="card card-bg">
      <div class="card-body">
        <h5 class="card-title">{{title}}</h5>
        <slot v-bind:text="text" class="card-text">
          <p class="card-text">{{text}}</p>
        </slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';

  @Component({
    components: {},
  })
  export default class InfoCard extends Vue {
    @Prop(String) private readonly title!: string;
    @Prop(String) private readonly text!: string;
  }
</script>

<style scoped>

</style>
