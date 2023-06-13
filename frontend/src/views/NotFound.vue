<template>
  <h1>{{ $t('menu.404') }}</h1>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-facing-decorator';

@Component
export default class NotFound extends Vue { }
</script>
