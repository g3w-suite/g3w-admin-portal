<template>
  <div class="d-flex flex-row flex-lg-column flex-xl-row g3w-white-border p-3 align-items-center justify-content-center">
    <div class="p-0 col-2 col-md-4 col-lg-4 col-xl-2 g3w-white-border">
      <div class="square">
        <div class="square_inner d-flex justify-content-center align-items-center">
          <font-awesome-icon :icon="icon" :size="size"></font-awesome-icon>
        </div>
      </div>
    </div>
    <div class="text-lg-center text-xl-left text-left text_container pl-5 pl-xl-3 pl-lg-0">
      <slot name="default">{{text}}</slot>
    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';

  @Component({
    components: {},
  })

  export default class InfoWidget extends Vue {
    @Prop(String) private readonly icon!: string;
    @Prop(String) private readonly size!: string;
    @Prop(String) private readonly text!: string;
  }
</script>

<style lang="scss" scoped>
  @import "../styles/_variables.scss";
  .g3w-white-border {
    border: 1px solid $white;
    border-radius: 3px;
  }
  .icon_container{
    width: $icon_width;
  }
  .text_container{
    width: (100 - $icon_width);
  }
</style>
