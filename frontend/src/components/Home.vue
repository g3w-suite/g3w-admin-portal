<template>
  <div>
    <h5 class="subtitle">{{settings.sub_title}}</h5>
    <h1 class="title">{{settings.title}}</h1>
    <p v-html="settings.home_description"></p>
  </div>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import {mapGetters} from 'vuex';
  const logo = require('@/assets/img/logo_g3wsuite.png');
  @Component({
    components: {},
    computed: {
      ...mapGetters({
        settings: 'info/info',
      }),
    },
  })
  export default class Home extends Vue {}
</script>

<style lang="scss" scoped>

</style>
