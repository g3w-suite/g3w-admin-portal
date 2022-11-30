<template>
  <fragment>
    <input
      type="search"
      id="search"
      name="search"
      v-model="search"
      :placeholder="$t('messages.menu.search_placeholder')"
      :aria-label="$t('messages.menu.search_placeholder')"
    />
    <Projects />
  </fragment>
</template>

<script lang="ts">
import { Info } from '@/types/TInfo';
import Projects from '@/views/Projects.vue';
import { Component, Vue } from 'vue-property-decorator';
import { mapGetters } from 'vuex';

@Component({
  components: { Projects },
  computed: {
    ...mapGetters({
      settings: 'info/info',
    }),
  },
})
export default class Search extends Vue {
  public settings!: Info;

  get search() {
    return this.$store.getters['group/search'];
  }

  set search(val: string) {
    this.$store.dispatch('group/search', {s: val});
  }
}
</script>

<style lang="scss" scoped>
</style>
