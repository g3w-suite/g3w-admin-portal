<template>
  <dialog ref="dialog"></dialog>
</template>

<script lang="ts">
import dialogPolyfill from 'dialog-polyfill';
import { Component, Vue } from 'vue-facing-decorator';

@Component
export default class Dialog extends Vue {

  public mounted() {
    dialogPolyfill.registerDialog((this.$refs as any).dialog);
  }

  public showModal() {
    (this.$refs as any).dialog.showModal();
  }

}
</script>