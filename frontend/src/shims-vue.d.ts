/**
 * Add typescript support for vue files
 */
declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}

declare module 'qs';
