<template>
  <fragment id="app">
    <router-view />
  </fragment>
</template>

<style lang="scss">

  @import "../node_modules/dialog-polyfill/dist/dialog-polyfill.css";
  @import '@picocss/pico/scss/pico.scss';

 /**
  * Override default SCSS variables
  * $primary-500: #e91e63;
  * $primary-600: #d81b60;
  * $primary-700: #c2185b;
  */

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

  /**
   * @requires "process.env.VUE_APP_CSS_COLOR" and "process.env.VUE_APP_CSS_COLOR_ALT"
   */
  /**
   * :root[data-color] body > nav:is(:nth-of-type(1), :nth-of-type(2)) {
   *   --custom-color: #fff;
   *   --background-color: var(--header-color, --background-color);
   *   --nav-border-color: rgba(255, 255, 255, 0.2);
   *   --primary: var(--custom-color, --secondary);
   *   --secondary: var(--custom-color, --secondary);
   *   --h1-color: var(--custom-color, --h1-color);
   *   --color: var(--custom-color, --color);
   *   --contrast-hover: var(--custom-color, --contrast-hover);
   *   --secondary-hover: var(--custom-color, --secondary-hover);
   *   --contrast: var(--custom-color, --contrast-hover);
   *   --icon-chevron: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='rgb(255, 255, 255)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
   *   --primary-hover: #1ab3e6;
   * }
   *
   * :root[data-color] body > nav:nth-of-type(1) {
   *   --background-color: var(--header-color-alt, --background-color);
   * }
   */
</style>
