<template>
  <a href="#" @click.prevent="scrollTop" v-show="visible" class="bottom-right" title="Back to top">
    <font-awesome-icon icon="chevron-up" size="lg" /><span hidden>UP</span>
  </a>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
  components: { },
})

export default class ScrollTopArrow extends Vue {
  public visible: boolean = false;

  public scrollTop() {
    window.scroll(0, 0);
  }

  public onScroll() {
   this.visible = window.scrollY > 150
  }

  public mounted() {
    window.addEventListener('scroll', this.onScroll)
  }
  
  public beforeDestroy() {
    window.removeEventListener('scroll', this.onScroll)
  }

};
</script>

<style lang="scss" scoped>
.bottom-right {
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.55);
  padding: 0.75rem;
  color: #fff;
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
}
</style>

