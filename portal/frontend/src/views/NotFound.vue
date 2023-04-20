<template>
  <fragment>
    <h1>{{ $t('messages.menu.404') }}</h1>
  </fragment>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({ components: { } })
export default class NotFound extends Vue { }
</script>
