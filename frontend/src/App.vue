<template>
  <fragment id="app">
    <router-view />
  </fragment>
</template>

<style lang="scss">
  //@import './styles/bootstrap-italia-custom.scss';
  //@import '../node_modules/bootstrap-italia/src/scss/bootstrap-italia.scss';

  html, body {
    scroll-behavior: smooth;
  }

  .show-on-mobile {
    display: none;
  }

  @media (max-width:768px) {
    .hide-on-mobile {
      display: none;
    }
    .show-on-mobile {
      display: block;
    }
  }
</style>
