<template>
  <fragment id="app">
    <router-view />
  </fragment>
</template>

<style lang="scss">
  //@import './styles/bootstrap-italia-custom.scss';
  //@import '../node_modules/bootstrap-italia/src/scss/bootstrap-italia.scss';

  :root {
    --font-family: "Titillium Web", system-ui,-apple-system, "Segoe UI", "Roboto", "Ubuntu", "Cantarell", "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji" !important;
  }

  html, body {
    scroll-behavior: smooth;
    scroll-padding-top: 1rem;
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
